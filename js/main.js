'use strict';

function draw_logic(){
    // Save the current buffer state.
    canvas_buffer.save();

    // Translate to camera position.
    canvas_buffer.translate(
      camera['x'],
      camera['y']
    );

    // Draw selection if not AI turn.
    if(core_entities[player_ids[turn]]
      && core_entities[player_ids[turn]]['ai'] === false
      && !core_entities[player_ids[turn]]['done']){
        draw_hexagon(
          core_mouse['x'],
          core_mouse['y'],
          core_storage_data['hexagon-size'] + 5,
          core_entities[player_ids[turn]]['color']
        );
    }

    // Draw hexagons.
    core_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          draw_hexagon(
            core_entities[entity]['x'],
            core_entities[entity]['y'],
            core_entities[entity]['size'],
            core_entities[entity]['color']
          );
      },
    });

    // Restore the buffer state.
    canvas_buffer.restore();

    let x = 75;

    // Draw scoreboard.
    for(let player in scoreboard){
        if(!core_entities[scoreboard[player]['id']]){
            continue;
        }

        canvas_setproperties({
          'properties': {
            'fillStyle': core_entities[scoreboard[player]['id']]['color'],
          },
        });
        canvas_buffer.fillText(
          core_entities[scoreboard[player]['id']]['name']
            + (core_entities[scoreboard[player]['id']]['done']
              ? '='
              : ':')
            + scoreboard[player]['hexagon-count'],
          0,
          x
        );
        x += 25;
    }

    // Draw winner.
    if(game_over){
        canvas_setproperties({
          'properties': {
            'fillStyle': core_entities[scoreboard[0]['id']]['color'],
          },
        });
        canvas_buffer.fillText(
          core_entities[scoreboard[0]['id']]['name'] + ' wins!',
          0,
          x
        );
    }
}

function logic(){
    if(!core_entities[player_ids[turn]]){
        return;
    }

    // Move camera left.
    if(core_keys[core_storage_data['move-←']]['state']
      && camera['x'] < width_half){
        camera['x'] += core_storage_data['scroll-speed'];
    }

    // Move camera right.
    if(core_keys[core_storage_data['move-→']]['state']
      && camera['x'] > -width_half){
        camera['x'] -= core_storage_data['scroll-speed'];
    }

    // Move camera down.
    if(core_keys[core_storage_data['move-↓']]['state']
      && camera['y'] > -height_half){
        camera['y'] -= core_storage_data['scroll-speed'];
    }

    // Move camera up.
    if(core_keys[core_storage_data['move-↑']]['state']
      && camera['y'] < height_half){
        camera['y'] += core_storage_data['scroll-speed'];
    }

    handle_turn();
    update_scoreboard();

    core_ui_update({
      'ids': {
        'turn': turns + turn_limit_string + ' ' + core_entities[player_ids[turn]]['name'],
        'unclaimed': unclaimed,
      },
    });
}

function repo_init(){
    core_repo_init({
      'entities': {
        'hexagon': {},
        'player': {
          'properties': {
            'done': false,
            'hexagon-count': 0,
            'name': '',
          },
        },
      },
      'events': {
        'start': {
          'onclick': function(){
              canvas_setmode({
                'newgame': true,
              });
          },
        },
      },
      'globals': {
        'camera': {},
        'game_over': false,
        'height_half': 0,
        'hexagon_size': 0,
        'input_required': false,
        'player_ids': [],
        'scoreboard': [],
        'turn': 0,
        'turn_limit_string': '',
        'turns': 0,
        'unclaimed': 0,
        'width_half': 0,
        'x_scaled': 0,
        'x_scaled_half': 0,
        'y_scaled': 0,
        'y_scaled_double': 0,
        'y_scaled_half': 0,
      },
      'info': '<input id=start type=button value="Start New Game">',
      'keybinds': {
        72: {
          'todo': function(){
              if(core_entities[player_ids[turn]]
                && !core_entities[player_ids[turn]]['ai']){
                  input_required = false;
                  end_turn();
              }
          },
        },
        80: {
          'todo': function(){
              if(!game_over
                && core_entities[player_ids[turn]]
                && !core_entities[player_ids[turn]]['ai']){
                  core_group_modify({
                    'groups': [
                      'hexagon',
                    ],
                    'todo': function(entity){
                        if(!core_entities[player_ids[turn]]){
                            return;
                        }

                        if(core_entities[entity]['color'] === core_entities[player_ids[turn]]['color']){
                            core_entities[entity]['color'] = core_storage_data['default-color'];
                            lose_hexagon(player_ids[turn]);
                            unclaimed += 1;
                        }
                    },
                  });
                  core_group_modify({
                    'groups': [
                      'player',
                    ],
                    'todo': function(entity){
                        core_entities[entity]['done'] = false;
                    },
                  });
                  input_required = false;
                  end_turn();
              }
          },
        },
      },
      'menu': true,
      'mousebinds': {
        'mousedown': {
          'todo': function(event){
              if(!core_entities[player_ids[turn]]
                || core_entities[player_ids[turn]]['ai']){
                  return;
              }

              let position = select_hexagon(
                core_mouse['x'],
                core_mouse['y']
              );

              // Check if a hexagon exists at this location
              //   with a different color.
              let target = false;
              core_group_modify({
                'groups': [
                  'hexagon',
                ],
                'todo': function(entity){
                    if(core_entities[entity]['x'] === position['x']
                     && core_entities[entity]['y'] === position['y']
                     && core_entities[entity]['color'] !== core_entities[player_ids[turn]]['color']){
                        target = entity;
                    }
                },
              });
              if(target === false){
                  return;
              }

              // Check if current player has a hexagon next to target hexagon.
              if(!check_neighbor_match({
                'x': core_entities[target]['x'],
                'y': core_entities[target]['y'],
              })){
                  return;
              }

              // Attempt to conquer the hexagon.
              conquer_hexagon(target);

              input_required = false;
          },
        },
        'mousemove': {
          'todo': function(){
              let x = core_mouse['x'] - canvas_properties['width-half'] - camera['x'];
              let y = core_mouse['y'] - canvas_properties['height-half'] - camera['y'];
              let position = select_hexagon(
                select_y_mod(
                  x,
                  y
                ),
                y
              );
              core_mouse['x'] = position['x'];
              core_mouse['y'] = position['y'];
          },
        },
      },
      'storage': {
        'ai': 4,
        'default-color': '#ffffff',
        'height': 500,
        'hexagon-count': 150,
        'hexagon-size': 25,
        'players': 1,
        'scroll-speed': 5,
        'turn-limit': Infinity,
        'width': 500,
      },
      'storage-menu': '<table><tr><td><input id=ai><td>AI<tr><td><input id=default-color type=color><td>Default Color<tr><td><input id=height><td>Height<tr><td><input id=hexagon-count><td>Hexagons<tr><td><input id=hexagon-size><td>Hexagon Size<tr><td><input id=players><td>Players<tr><td><input id=scroll-speed><td>Scroll Speed<tr><td><input id=turn-limit><td>Turn Limit<tr><td><input id=width><td>Width</table>',
      'title': 'Hexagons-2D.htm',
      'ui': 'Turn: <span id=turn></span><br>Unclaimed: <span id=unclaimed></span>',
    });
    canvas_init();
}
