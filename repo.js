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

    if(options.length){
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
      || (core_storage_data['turn-limit'] > 0 && turns >= core_storage_data['turn-limit'])){
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
    turn_limit_string = core_storage_data['turn-limit'] > 0
      ? '/' + core_storage_data['turn-limit']
      : '';

    x_scaled = core_storage_data['hexagon-size'] * 1.84;
    x_scaled_half = x_scaled / 2;
    y_scaled = core_storage_data['hexagon-size'] * 1.6;
    y_scaled_double = y_scaled * 2;
    y_scaled_half = y_scaled / 2;

    height_half = core_storage_data['height'] / 2;
    width_half = core_storage_data['width'] / 2;

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

function update_position(){
   const x = core_mouse['x'] - canvas_properties['width-half'] - camera['x'];
   const y = core_mouse['y'] - canvas_properties['height-half'] - camera['y'];
   const position = select_hexagon(
     select_y_mod(
       x,
       y
     ),
     y
   );
   core_mouse['x'] = position['x'];
   core_mouse['y'] = position['y'];

   return position;
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
