'use strict';

function check_done(id){
    var options = [];
    var returned = false;

    core_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          if(core_entities[entity]['color'] !== core_entities[id]['color']){
              if(check_neighbor_match({
                'x': core_entities[entity]['x'],
                'y': core_entities[entity]['y'],
              })){
                  if(core_entities[entity]['color'] === core_storage_data['default-color']){
                      returned = entity;

                  }else{
                      options.push(entity);
                  }
              }
          }
      },
    });

    if(returned !== false){
        return returned;
    }

    if(options.length > 0){
        sort_random({
          'array': options,
        });
        for(var i = scoreboard.length; i--;){
            if(!core_entities[scoreboard[i]['id']]){
                continue;
            }

            for(var option in options){
                if(core_entities[options[option]]['color'] === core_entities[scoreboard[i]['id']]['color']){
                    return options[option];
                }
            }
        }

    }else{
        core_entities[id]['done'] = true;
    }

    return false;
}

function check_neighbor_match(position){
    var next_positions = [
      [-x_scaled_half, -y_scaled,],
      [-x_scaled, 0,],
      [-x_scaled_half, y_scaled,],
      [x_scaled_half, -y_scaled,],
      [x_scaled, 0,],
      [x_scaled_half, y_scaled,],
    ];
    var returned = false;

    for(var next_position in next_positions){
        if(position['y'] % y_scaled_double){
            next_positions[next_position][0] += x_scaled;
        }

        var new_next_position = select_hexagon(
          select_y_mod(
            position['x'] + next_positions[next_position][0],
            position['y'] + next_positions[next_position][1]
          ),
          position['y'] + next_positions[next_position][1]
        );
        core_group_modify({
          'groups': [
            'hexagon',
          ],
          'todo': function(entity){
              if(core_entities[entity]['x'] === new_next_position['x']
                && core_entities[entity]['y'] === new_next_position['y']
                && core_entities[entity]['color'] === core_entities[player_ids[turn]]['color']){
                  returned = true;
              }
          },
        });
    }

    return returned;
}

function conquer_hexagon(hexagon, playerid){
    playerid = playerid || player_ids[turn];

    if(core_entities[hexagon]['color'] !== core_entities[playerid]['color']){
        if(core_entities[hexagon]['color'] === core_storage_data['default-color']){
            core_entities[hexagon]['color'] = core_entities[playerid]['color'];
            core_entities[playerid]['hexagons'] += 1;
            unclaimed -= 1;

        }else if(core_random_boolean()){
            var old_color = core_entities[hexagon]['color'];
            core_entities[hexagon]['color'] = core_entities[playerid]['color'];
            core_entities[playerid]['hexagons'] += 1;
            core_group_modify({
              'groups': [
                'player',
              ],
              'todo': function(entity){
                  if(old_color === core_entities[entity]['color']){
                      lose_hexagon(entity);
                  }
              },
            });
        }
    }
}

function create_hexagon(position, size){
    // Only create a hexagon if one doesn't already exist at this x,y.
    var exists = false;
    core_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          if(core_entities[entity]['x'] === position['x']
            && core_entities[entity]['y'] === position['y']){
              exists = true;
          }
      },
    });
    if(exists){
        return;
    }

    core_entity_create({
      'properties': {
        'color': core_storage_data['default-color'],
        'size': size,
        'x': position['x'],
        'y': position['y'],
      },
      'types': [
        'hexagon',
      ],
    });
    unclaimed = core_entity_info['hexagon']['count'];
}

function create_player(properties){
    if(core_entity_info['player']['count'] > core_entity_info['hexagon']['count'] - 1){
        return;
    }

    var id = core_entity_info['player']['count'];
    properties = properties || {};
    properties = {
      'ai': properties['ai'] || false,
      'color': properties['color'] || '#' + core_random_hex(),
    };
    properties['name'] = (properties['ai']
      ? 'AI'
      : 'P')
      + properties['color'];

    core_entity_create({
      'id': id,
      'properties': properties,
      'types': [
        'player',
      ],
    });
    player_ids.push(id);

    var hexagon = core_random_key({
      'object': core_groups['hexagon'],
    });
    while(core_entities[hexagon]['color'] !== core_storage_data['default-color']){
        hexagon = core_random_key({
          'object': core_groups['hexagon'],
        });
    }
    conquer_hexagon(
      hexagon,
      id
    );

    check_done(id);
}

function draw_hexagon(x, y, size, color){
    if(y % hexagon_size){
        x += x_scaled_half;
    }

    var vertices = [];
    for(var i = 0; i < 6; i++){
        var angle = math_degrees_to_radians({
          'degrees': 30 + i * 60,
        });
        vertices.push({
          'type': i === 0
            ? 'moveTo'
            : 'lineTo',
          'x': x + Math.cos(angle) * size + canvas_x,
          'y': y + Math.sin(angle) * size + canvas_y,
        });
    }
    canvas_draw_path({
      'properties': {
        'fillStyle': color,
      },
      'vertices': vertices,
    });
}

function end_turn(){
    var over = true;
    core_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          if(!core_entities[entity]['done']){
              over = false;
          }
      },
    });
    if(over
      || turns >= core_storage_data['turn-limit']){
        game_over = true;
        return;
    }

    if(turn >= player_ids.length - 1){
        turn = 0;

    }else{
        turn += 1;
    }

    if(!core_entities[player_ids[turn]]){
        end_turn();

    }else{
        input_required = !core_entities[player_ids[turn]]['ai'];
        turns += 1;
    }
}

function handle_turn(){
    if(!core_entities[player_ids[turn]]
      || (input_required && !core_entities[player_ids[turn]]['done'])
      || game_over){
        return;
    }

    if(!core_entities[player_ids[turn]]['done']){
        var target = check_done(player_ids[turn]);
        if(core_entities[player_ids[turn]]['ai']
          && target !== false){
            conquer_hexagon(target);
        }
    }

    end_turn();
}

function load_data(id){
    camera = {
      'x': 0,
      'y': 0,
    };
    game_over = false;
    player_ids = [];
    scoreboard = [];
    turn = 0;
    turns = 0;
    unclaimed = 0;

    hexagon_size = Math.floor(core_storage_data['hexagon-size'] * 3.2);
    turn_limit_string = isFinite(core_storage_data['turn-limit'])
      ? '/' + core_storage_data['turn-limit']
      : '';

    x_scaled = core_storage_data['hexagon-size'] * 1.84;
    x_scaled_half = x_scaled / 2;
    y_scaled = core_storage_data['hexagon-size'] * 1.6;
    y_scaled_double = y_scaled * 2;
    y_scaled_half = y_scaled / 2;

    height_half = core_storage_data['height'] / 2;
    width_half = core_storage_data['width'] / 2;

    // Create base hexagons.
    var loop_counter = core_storage_data['hexagons'] - 1;
    do{
        create_hexagon(
          select_hexagon(
            core_random_integer({
              'max': core_storage_data['width'],
            }) - width_half,
            core_random_integer({
              'max': core_storage_data['height'],
            }) - height_half
          ),
          core_storage_data['hexagon-size']
        );
    }while(loop_counter--);

    // Create players.
    for(var i = core_storage_data['players']; i--;){
        create_player();
    }

    // Create AI.
    for(var i = core_storage_data['ai']; i--;){
        create_player({
          'ai': true,
        });
    }

    input_required = !core_entities[player_ids[turn]]['ai'];
}

function lose_hexagon(player){
    core_entities[player]['hexagons'] -= 1;
    if(core_entities[player]['hexagons'] <= 0){
        core_entity_remove({
          'entities': [
            player,
          ],
        });
    }
}

function select_hexagon(x, y){
    return {
      'x': Math.ceil((x - x_scaled_half) / x_scaled) * x_scaled,
      'y': Math.ceil((y - y_scaled_half) / y_scaled) * y_scaled,
    };
}

function select_y_mod(x, y, move){
    move = move || -(x_scaled_half);

    var y_mod = Math.abs(y % y_scaled_double);
    if(y_mod > y_scaled_half
      && y_mod < y_scaled * 1.5){
        x += move;
    }

    return x;
}

function update_scoreboard(){
    scoreboard = [];
    core_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          scoreboard.push({
            'hexagons': core_entities[entity]['hexagons'],
            'id': entity,
          });
      },
    });
    sort_property({
      'array': scoreboard,
      'property': 'hexagons',
      'reverse': true,
    });
}
