'use strict';

function repo_drawlogic(){
    canvas_buffer.save();
    canvas_buffer.translate(
      camera['x'],
      camera['y']
    );

    if(entity_entities[player_ids[turn]]
      && entity_entities[player_ids[turn]]['ai'] === false
      && !entity_entities[player_ids[turn]]['done']){
        draw_hexagon(
          core_mouse['x'],
          core_mouse['y'],
          core_storage_data['hexagon-size'] + 5,
          entity_entities[player_ids[turn]]['color']
        );
    }

    entity_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          draw_hexagon(
            entity_entities[entity]['x'],
            entity_entities[entity]['y'],
            entity_entities[entity]['size'],
            entity_entities[entity]['color']
          );
      },
    });

    canvas_buffer.restore();

    let x = 75;

    for(const player in scoreboard){
        if(!entity_entities[scoreboard[player]['id']]){
            continue;
        }

        canvas_setproperties({
          'properties': {
            'fillStyle': entity_entities[scoreboard[player]['id']]['color'],
          },
        });
        canvas_buffer.fillText(
          entity_entities[scoreboard[player]['id']]['name']
            + (entity_entities[scoreboard[player]['id']]['done']
              ? '='
              : ':')
            + scoreboard[player]['hexagon-count'],
          0,
          x
        );
        x += 25;
    }

    if(game_over){
        canvas_setproperties({
          'properties': {
            'fillStyle': entity_entities[scoreboard[0]['id']]['color'],
          },
        });
        canvas_buffer.fillText(
          entity_entities[scoreboard[0]['id']]['name'] + ' wins!',
          0,
          x
        );
    }
}

function repo_logic(){
    if(!entity_entities[player_ids[turn]]){
        return;
    }

    if(core_keys[core_storage_data['move-←']]['state']
      && camera['x'] < width_half){
        camera['x'] += core_storage_data['scroll-speed'];
    }
    if(core_keys[core_storage_data['move-→']]['state']
      && camera['x'] > -width_half){
        camera['x'] -= core_storage_data['scroll-speed'];
    }
    if(core_keys[core_storage_data['move-↓']]['state']
      && camera['y'] > -height_half){
        camera['y'] -= core_storage_data['scroll-speed'];
    }
    if(core_keys[core_storage_data['move-↑']]['state']
      && camera['y'] < height_half){
        camera['y'] += core_storage_data['scroll-speed'];
    }

    handle_turn();
    update_scoreboard();

    core_ui_update({
      'ids': {
        'turn': turns + turn_limit_string + ' ' + entity_entities[player_ids[turn]]['name'],
        'unclaimed': unclaimed,
      },
    });
}

function repo_escape(){
    if(!entity_entities['hexagon-0']
      && !core_menu_open){
        core_repo_reset();
    }
}

function repo_init(){
    core_repo_init({
      'events': {
        'start': {
          'onclick': core_repo_reset,
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
        80: {
          'todo': function(){
              if(!game_over
                && entity_entities[player_ids[turn]]
                && !entity_entities[player_ids[turn]]['ai']){
                  entity_group_modify({
                    'groups': [
                      'hexagon',
                    ],
                    'todo': function(entity){
                        if(!entity_entities[player_ids[turn]]){
                            return;
                        }

                        if(entity_entities[entity]['color'] === entity_entities[player_ids[turn]]['color']){
                            entity_entities[entity]['color'] = core_storage_data['unclaimed-color'];
                            lose_hexagon(player_ids[turn]);
                            unclaimed += 1;
                        }
                    },
                  });
                  entity_group_modify({
                    'groups': [
                      'player',
                    ],
                    'todo': function(entity){
                        entity_entities[entity]['done'] = false;
                    },
                  });
                  input_required = false;
                  end_turn();
              }
          },
        },
        88: {
          'todo': function(){
              if(entity_entities[player_ids[turn]]
                && !entity_entities[player_ids[turn]]['ai']){
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
              if(!entity_entities[player_ids[turn]]
                || entity_entities[player_ids[turn]]['ai']){
                  return;
              }

              const position = update_position();

              let target = false;
              entity_group_modify({
                'groups': [
                  'hexagon',
                ],
                'todo': function(entity){
                    if(entity_entities[entity]['x'] === position['x']
                     && entity_entities[entity]['y'] === position['y']
                     && entity_entities[entity]['color'] !== entity_entities[player_ids[turn]]['color']){
                        target = entity;
                    }
                },
              });
              if(target === false){
                  return;
              }

              if(!check_neighbor_match({
                'x': entity_entities[target]['x'],
                'y': entity_entities[target]['y'],
              })){
                  return;
              }

              conquer_hexagon(target);

              input_required = false;
          },
        },
        'mousemove': {
          'todo': update_position,
        },
      },
      'reset': canvas_setmode,
      'storage': {
        'ai': 4,
        'height': 500,
        'hexagon-count': 150,
        'hexagon-size': 25,
        'players': 1,
        'scroll-speed': 5,
        'turn-limit': 0,
        'unclaimed-color': '#ffffff',
        'width': 500,
      },
      'storage-menu': '<table><tr><td><input class=mini id=ai min=0 step=any type=number><td>AI'
        + '<tr><td><input class=mini id=height min=1 step=any type=number><td>Height'
        + '<tr><td><input class=mini id=hexagon-count min=1 step=any type=number><td>Hexagons'
        + '<tr><td><input class=mini id=hexagon-size min=1 step=any type=number><td>Hexagon Size'
        + '<tr><td><input class=mini id=players min=0 step=any type=number><td>Players'
        + '<tr><td><input class=mini id=scroll-speed min=1 step=any type=number><td>Scroll Speed'
        + '<tr><td><input class=mini id=turn-limit min=0 step=any type=number><td>Turn Limit'
        + '<tr><td><input id=unclaimed-color type=color><td>Unclaimed Color'
        + '<tr><td><input class=mini id=width min=1 step=any type=number><td>Width</table>',
      'title': 'Hexagons-2D.htm',
      'ui': 'Turn: <span id=turn></span><br>Unclaimed: <span id=unclaimed></span>',
    });
    entity_set({
      'type': 'hexagon',
    });
    entity_set({
      'properties': {
        'done': false,
        'hexagon-count': 0,
        'name': '',
      },
      'type': 'player',
    });
    canvas_init({
      'cursor': 'pointer',
    });
}
