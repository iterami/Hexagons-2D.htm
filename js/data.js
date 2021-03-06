'use strict';

function check_done(id){
    let options = [];
    let returned = false;

    entity_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          if(entity_entities[entity]['color'] !== entity_entities[id]['color']){
              if(check_neighbor_match({
                'x': entity_entities[entity]['x'],
                'y': entity_entities[entity]['y'],
              })){
                  if(entity_entities[entity]['color'] === core_storage_data['unclaimed-color']){
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
        options = core_sort_random({
          'array': options,
        });
        for(let i = scoreboard.length; i--;){
            if(!entity_entities[scoreboard[i]['id']]){
                continue;
            }

            for(const option in options){
                if(entity_entities[options[option]]['color'] === entity_entities[scoreboard[i]['id']]['color']){
                    return options[option];
                }
            }
        }

    }else{
        entity_entities[id]['done'] = true;
    }

    return false;
}

function check_neighbor_match(position){
    const next_positions = [
      [-x_scaled_half, -y_scaled,],
      [-x_scaled, 0,],
      [-x_scaled_half, y_scaled,],
      [x_scaled_half, -y_scaled,],
      [x_scaled, 0,],
      [x_scaled_half, y_scaled,],
    ];
    let returned = false;

    for(const next_position in next_positions){
        if(position['y'] % y_scaled_double){
            next_positions[next_position][0] += x_scaled;
        }

        const new_next_position = select_hexagon(
          select_y_mod(
            position['x'] + next_positions[next_position][0],
            position['y'] + next_positions[next_position][1]
          ),
          position['y'] + next_positions[next_position][1]
        );
        entity_group_modify({
          'groups': [
            'hexagon',
          ],
          'todo': function(entity){
              if(entity_entities[entity]['x'] === new_next_position['x']
                && entity_entities[entity]['y'] === new_next_position['y']
                && entity_entities[entity]['color'] === entity_entities[player_ids[turn]]['color']){
                  returned = true;
              }
          },
        });
    }

    return returned;
}

function conquer_hexagon(hexagon, playerid){
    playerid = playerid || player_ids[turn];

    if(entity_entities[hexagon]['color'] !== entity_entities[playerid]['color']){
        if(entity_entities[hexagon]['color'] === core_storage_data['unclaimed-color']){
            entity_entities[hexagon]['color'] = entity_entities[playerid]['color'];
            entity_entities[playerid]['hexagon-count'] += 1;
            unclaimed -= 1;

        }else if(core_random_boolean()){
            const old_color = entity_entities[hexagon]['color'];
            entity_entities[hexagon]['color'] = entity_entities[playerid]['color'];
            entity_entities[playerid]['hexagon-count'] += 1;
            entity_group_modify({
              'groups': [
                'player',
              ],
              'todo': function(entity){
                  if(old_color === entity_entities[entity]['color']){
                      lose_hexagon(entity);
                  }
              },
            });
        }
    }
}

function create_hexagon(position, size){
    // Only create a hexagon if one doesn't already exist at this x,y.
    let exists = false;
    entity_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          if(entity_entities[entity]['x'] === position['x']
            && entity_entities[entity]['y'] === position['y']){
              exists = true;
          }
      },
    });
    if(exists){
        return;
    }

    const count = entity_info['hexagon']['count'];
    unclaimed = count + 1;
    entity_create({
      'id': 'hexagon-' + count,
      'properties': {
        'color': core_storage_data['unclaimed-color'],
        'size': size,
        'x': position['x'],
        'y': position['y'],
      },
      'types': [
        'hexagon',
      ],
    });
}

function create_player(properties, homebase){
    if(entity_info['player']['count'] > entity_info['hexagon']['count'] - 1){
        return;
    }

    const id = entity_info['player']['count'];
    properties = properties || {};
    properties = {
      'ai': properties['ai'] || false,
      'color': properties['color'] || '#' + core_random_hex(),
    };
    properties['name'] = (properties['ai']
      ? 'AI'
      : 'P')
      + properties['color'];

    entity_create({
      'id': id,
      'properties': properties,
      'types': [
        'player',
      ],
    });
    player_ids.push(id);

    conquer_hexagon(
      homebase,
      id
    );

    check_done(id);
}

function draw_hexagon(x, y, size, color){
    if(y % hexagon_size){
        x += x_scaled_half;
    }

    const vertices = [];
    for(let i = 0; i < 6; i++){
        const angle = math_degrees_to_radians({
          'degrees': 30 + i * 60,
        });
        vertices.push({
          'type': i === 0
            ? 'moveTo'
            : 'lineTo',
          'x': x + Math.cos(angle) * size + canvas_properties['width-half'],
          'y': y + Math.sin(angle) * size + canvas_properties['height-half'],
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
    let over = true;
    entity_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          if(!entity_entities[entity]['done']){
              over = false;
          }
      },
    });
    if(over
      || turns >= core_storage_data['turn-limit']){
        game_over = true;
        return;
    }

    turn += 1;
    if(turn >= player_ids.length){
        turn = 0;
    }

    if(!entity_entities[player_ids[turn]]){
        end_turn();

    }else{
        input_required = !entity_entities[player_ids[turn]]['ai'];
        turns += 1;
    }
}

function handle_turn(){
    if(!entity_entities[player_ids[turn]]
      || (input_required && !entity_entities[player_ids[turn]]['done'])
      || game_over){
        return;
    }

    if(!entity_entities[player_ids[turn]]['done']){
        const target = check_done(player_ids[turn]);
        if(entity_entities[player_ids[turn]]['ai']
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
    turn_limit_string = Number.isFinite(core_storage_data['turn-limit'])
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
    let loop_counter = core_storage_data['hexagon-count'] - 1;
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

    const available_hexagons = Object.keys(entity_groups['hexagon']);

    // Create players.
    for(let i = core_storage_data['players']; i--;){
        if(available_hexagons.length === 0){
            break;
        }

        create_player(
          {},
          core_random_splice({
            'array': available_hexagons,
          })
        );
    }

    // Create AI.
    const ai_count = entity_info['hexagon']['count'] < core_storage_data['ai']
      ? entity_info['hexagon']['count'] - 2
      : core_storage_data['ai'];
    for(let i = ai_count; i--;){
        if(available_hexagons.length === 0){
            break;
        }

        create_player(
          {
            'ai': true,
          },
          core_random_splice({
            'array': available_hexagons,
          })
        );
    }

    input_required = !entity_entities[player_ids[turn]]['ai'];
}

function lose_hexagon(player){
    entity_entities[player]['hexagon-count'] -= 1;
    if(entity_entities[player]['hexagon-count'] <= 0){
        entity_remove({
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

function select_y_mod(x, y){
    const y_mod = Math.abs(y % y_scaled_double);
    if(y_mod > y_scaled_half
      && y_mod < y_scaled * 1.5){
        x += -x_scaled_half;
    }

    return x;
}

function update_scoreboard(){
    scoreboard = [];
    entity_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          scoreboard.push({
            'hexagon-count': entity_entities[entity]['hexagon-count'],
            'id': entity,
          });
      },
    });
    scoreboard = core_sort_property({
      'array': scoreboard,
      'property': 'hexagon-count',
      'reverse': true,
    });
}
