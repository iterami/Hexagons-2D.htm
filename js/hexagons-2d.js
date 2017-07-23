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
    if(players[player_ids[turn]]
      && players[player_ids[turn]]['ai'] === false
      && !players[player_ids[turn]]['done']){
        draw_hexagon(
          core_mouse['x'],
          core_mouse['y'],
          core_storage_data['hexagon-size'] + 5,
          players[player_ids[turn]]['color']
        );
    }

    // Draw hexagons.
    for(var hexagon in hexagons){
        draw_hexagon(
          hexagons[hexagon]['x'],
          hexagons[hexagon]['y'],
          hexagons[hexagon]['size'],
          hexagons[hexagon]['color']
        );
    }

    // Restore the buffer state.
    canvas_buffer.restore();

    var x = 75;

    // Draw scoreboard.
    for(var player in scoreboard){
        if(!players[scoreboard[player]['id']]){
            continue;
        }

        canvas_buffer.fillStyle = players[scoreboard[player]['id']]['color'];
        canvas_buffer.fillText(
          players[scoreboard[player]['id']]['name']
            + (players[scoreboard[player]['id']]['done']
              ? '='
              : ':')
            + scoreboard[player]['hexagons'],
          0,
          x
        );
        x += 25;
    }

    // Draw winner.
    if(game_over){
        canvas_buffer.fillStyle = players[scoreboard[0]['id']]['color'];
        canvas_buffer.fillText(
          players[scoreboard[0]['id']]['name'] + ' wins!',
          0,
          x
        );
    }
}

function logic(){
    // Move camera left.
    if(core_keys[65]['state']
      && camera['x'] < width_half){
        camera['x'] += core_storage_data['scroll-speed'];
    }

    // Move camera right.
    if(core_keys[68]['state']
      && camera['x'] > -width_half){
        camera['x'] -= core_storage_data['scroll-speed'];
    }

    // Move camera down.
    if(core_keys[83]['state']
      && camera['y'] > -height_half){
        camera['y'] -= core_storage_data['scroll-speed'];
    }

    // Move camera up.
    if(core_keys[87]['state']
      && camera['y'] < height_half){
        camera['y'] += core_storage_data['scroll-speed'];
    }

    handle_turn();
    update_scoreboard();

    core_ui_update({
      'ids': {
        'turn': turns + turn_limit_string + ' ' + players[player_ids[turn]]['name'],
        'unclaimed': unclaimed,
      },
    });
}

function repo_init(){
    core_repo_init({
      'info': '<input onclick=canvas_setmode({newgame:true}) type=button value="Start New Game">',
      'keybinds': {
        65: {},
        68: {},
        72: {
          'todo': function(){
              if(players[player_ids[turn]]
                && !players[player_ids[turn]]['ai']){
                  input_required = false;
                  end_turn();
              }
          },
        },
        80: {
          'todo': function(){
              if(!game_over
                && players[player_ids[turn]]
                && !players[player_ids[turn]]['ai']){
                  for(var hexagon in hexagons){
                      if(!players[player_ids[turn]]){
                          break;
                        }
                      if(hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
                          hexagons[hexagon]['color'] = core_storage_data['default-color'];
                          lose_hexagon(player_ids[turn]);
                          unclaimed += 1;
                      }
                  }
                  for(var player in players){
                      players[player]['done'] = false;
                  }
                  input_required = false;
                  end_turn();
              }
          },
        },
        83: {},
        87: {},
      },
      'menu': true,
      'mousebinds': {
        'mousedown': {
          'todo': function(event){
              if(!players[player_ids[turn]]
                || players[player_ids[turn]]['ai']){
                  return;
              }

              var position = select_hexagon(
                core_mouse['x'],
                core_mouse['y']
              );

              // Check if a hexagon exists at this location
              //   with a different color.
              var target = false;
              for(var hexagon in hexagons){
                  if(hexagons[hexagon]['x'] === position['x']
                    && hexagons[hexagon]['y'] === position['y']
                    && hexagons[hexagon]['color'] !== players[player_ids[turn]]['color']){
                      target = hexagon;
                      break;
                  }
              }
              if(target === false){
                  return;
              }

              // Check if current player has a hexagon next to target hexagon.
              if(!check_neighbor_match({
                'x': hexagons[target]['x'],
                'y': hexagons[target]['y'],
              })){
                  return;
              }

              // Attempt to conquer the hexagon.
              conquer_hexagon(hexagon);

              input_required = false;
          },
        },
        'mousemove': {
          'todo': function(){
              var x = core_mouse['x'] - canvas_x - camera['x'];
              var y = core_mouse['y'] - canvas_y - camera['y'];
              var position = select_hexagon(
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
        'hexagon-size': 25,
        'hexagons': 150,
        'players': 1,
        'scroll-speed': 5,
        'turn-limit': Infinity,
        'width': 500,
      },
      'storage-menu': '<table><tr><td><input id=ai><td>AI<tr><td><input id=default-color type=color><td>Default Color<tr><td><input id=height><td>Height<tr><td><input id=hexagons><td>Hexagons<tr><td><input id=hexagon-size><td>Hexagon Size<tr><td><input id=players><td>Players<tr><td><input id=scroll-speed><td>Scroll Speed<tr><td><input id=turn-limit><td>Turn Limit<tr><td><input id=width><td>Width</table>',
      'title': 'Hexagons-2D.htm',
      'ui': 'Turn: <span id=ui-turn></span><br>Unclaimed: <span id=ui-unclaimed></span>',
    });
    canvas_init();
}

var camera = {};
var game_over = false;
var height_half = 0;
var hexagon_size = 0;
var hexagons = [];
var input_required = false;
var player_count = 0;
var player_ids = [];
var players = {};
var scoreboard = [];
var turn = 0;
var turn_limit_string = '';
var turns = 0;
var unclaimed = 0;
var width_half = 0;
var x_scaled = 0;
var x_scaled_half = 0;
var y_scaled = 0;
var y_scaled_double = 0;
var y_scaled_half = 0;
