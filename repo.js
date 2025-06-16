'use strict';

function check_done(id){
    const options = [];
    let returned = false;

    entity_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          if(entity.color !== entity_entities[id].color){
              if(check_neighbor_match(entity.x, entity.y)){
                  if(entity.color === core_storage_data.unclaimed_color){
                      returned = entity.id;

                  }else{
                      options.push(entity.id);
                  }
              }
          }
      },
    });

    if(returned !== false){
        return returned;
    }

    if(options.length){
        core_sort_random({
          'array': options,
          'clone': false,
        });
        for(let i = scoreboard.length; i--;){
            if(!entity_entities[scoreboard[i].id]){
                continue;
            }

            for(const option in options){
                if(entity_entities[options[option]].color === entity_entities[scoreboard[i].id].color){
                    return options[option];
                }
            }
        }

    }else{
        entity_entities[id].done = true;
    }

    return false;
}

function check_neighbor_match(x, y){
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
        if(y % y_scaled_double){
            next_positions[next_position][0] += x_scaled;
        }

        const new_next_position = select_hexagon(
          select_y_mod(
            x + next_positions[next_position][0],
            y + next_positions[next_position][1]
          ),
          y + next_positions[next_position][1]
        );
        entity_group_modify({
          'groups': [
            'hexagon',
          ],
          'todo': function(entity){
              if(entity.x === new_next_position.x
                && entity.y === new_next_position.y
                && entity.color === entity_entities[player_ids[turn]].color){
                  returned = true;
              }
          },
        });
    }

    return returned;
}

function conquer_hexagon(hexagon, playerid){
    playerid = playerid || player_ids[turn];

    if(entity_entities[hexagon].color !== entity_entities[playerid].color){
        if(entity_entities[hexagon].color === core_storage_data.unclaimed_color){
            entity_entities[hexagon].color = entity_entities[playerid].color;
            entity_entities[playerid].hexagon_count += 1;
            unclaimed -= 1;

        }else if(core_random_boolean()){
            const old_color = entity_entities[hexagon].color;
            entity_entities[hexagon].color = entity_entities[playerid].color;
            entity_entities[playerid].hexagon_count += 1;
            entity_group_modify({
              'groups': [
                'player',
              ],
              'todo': function(entity){
                  if(old_color === entity.color){
                      lose_hexagon(entity.id);
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
          if(entity.x === position.x
            && entity.y === position.y){
              exists = true;
          }
      },
    });
    if(exists){
        return;
    }

    const count = entity_info.hexagon.count;
    unclaimed = count + 1;
    entity_create({
      'id': 'hexagon_' + count,
      'properties': {
        'color': core_storage_data.unclaimed_color,
        'size': size,
        'x': position.x,
        'y': position.y,
      },
      'types': [
        'hexagon',
      ],
    });
}

function create_player(properties, homebase){
    if(entity_info.player.count > entity_info.hexagon.count - 1){
        return;
    }

    properties = properties || {};
    properties = {
      'ai': properties.ai || false,
      'color': properties.color || '#' + core_random_hex(),
    };
    properties.name = (properties.ai
      ? 'AI'
      : 'P')
      + properties.color;

    const id = entity_id_count;
    entity_create({
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
        const angle = math_degrees_to_radians(30 + i * 60);
        vertices.push([
          i === 0
            ? 'moveTo'
            : 'lineTo',
          x + Math.cos(angle) * size + canvas_properties.width_half,
          y + Math.sin(angle) * size + canvas_properties.height_half,
        ]);
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
          if(!entity.done){
              over = false;
          }
      },
    });
    if(over
      || (core_storage_data.turn_limit > 0 && turns >= core_storage_data.turn_limit)){
        game_over = true;
        return;
    }

    turn += 1;
    if(turn >= player_ids.length){
        turn = 0;
    }

    update_scoreboard();

    if(!entity_entities[player_ids[turn]]){
        end_turn();

    }else{
        input_required = !entity_entities[player_ids[turn]].ai;
        turns += 1;
    }
}

function handle_turn(){
    if(!entity_entities[player_ids[turn]]
      || (input_required && !entity_entities[player_ids[turn]].done)
      || game_over){
        return;
    }

    if(!entity_entities[player_ids[turn]].done){
        const target = check_done(player_ids[turn]);
        if(entity_entities[player_ids[turn]].ai
          && target !== false){
            conquer_hexagon(target);
        }
    }

    end_turn();
}

function load_data(id){
    reset_camera();
    game_over = false;
    core_object_reset(player_ids);
    turn = 0;
    turns = 0;
    unclaimed = 0;

    hexagon_size = Math.floor(core_storage_data.hexagon_size * 3.2);
    turn_limit_string = core_storage_data.turn_limit > 0
      ? '/' + core_storage_data.turn_limit
      : '';

    x_scaled = core_storage_data.hexagon_size * 1.84;
    x_scaled_half = x_scaled / 2;
    y_scaled = core_storage_data.hexagon_size * 1.6;
    y_scaled_double = y_scaled * 2;
    y_scaled_half = y_scaled / 2;

    let loop_counter = Math.floor(core_storage_data.hexagon_count) - 1;
    do{
        create_hexagon(
          select_hexagon(
            core_random_integer(core_storage_data.width),
            core_random_integer(core_storage_data.height)
          ),
          core_storage_data.hexagon_size
        );
    }while(loop_counter--);

    const available_hexagons = Object.keys(entity_groups.hexagon);

    for(let i = Math.floor(core_storage_data.players); i--;){
        if(available_hexagons.length === 0){
            break;
        }

        create_player(
          {},
          core_random_splice(available_hexagons)
        );
    }

    const ai_count = Math.floor(entity_info.hexagon.count < core_storage_data.ai
      ? entity_info.hexagon.count - 2
      : core_storage_data.ai);
    for(let i = ai_count; i--;){
        if(available_hexagons.length === 0){
            break;
        }

        create_player(
          {
            'ai': true,
          },
          core_random_splice(available_hexagons)
        );
    }

    input_required = !entity_entities[player_ids[turn]].ai;
    update_scoreboard();
}

function lose_hexagon(player){
    entity_entities[player].hexagon_count -= 1;
    if(entity_entities[player].hexagon_count <= 0){
        entity_remove({
          'entities': [
            player,
          ],
        });
    }
}

function repo_drawlogic(){
    canvas.save();
    canvas.translate(
      -camera_x,
      -camera_y
    );

    if(entity_entities[player_ids[turn]]
      && entity_entities[player_ids[turn]].ai === false
      && !entity_entities[player_ids[turn]].done){
        draw_hexagon(
          position_x,
          position_y,
          core_storage_data.hexagon_size + 5,
          entity_entities[player_ids[turn]].color
        );
    }

    entity_group_modify({
      'groups': [
        'hexagon',
      ],
      'todo': function(entity){
          draw_hexagon(
            entity.x,
            entity.y,
            entity.size,
            entity.color
          );
      },
    });

    canvas.restore();

    let x = 75;

    for(const player in scoreboard){
        if(!entity_entities[scoreboard[player].id]){
            continue;
        }

        canvas_setproperties({
          'fillStyle': entity_entities[scoreboard[player].id].color,
        });
        canvas.fillText(
          entity_entities[scoreboard[player].id].name
            + (entity_entities[scoreboard[player].id].done
              ? '='
              : ':')
            + scoreboard[player].hexagon_count,
          0,
          x
        );
        x += 25;
    }

    if(game_over){
        canvas_setproperties({
          'fillStyle': entity_entities[scoreboard[0].id].color,
        });
        canvas.fillText(
          entity_entities[scoreboard[0].id].name + ' wins!',
          0,
          x
        );
    }
}

function repo_escape(){
    if(!entity_entities.hexagon_0
      && !core_menu_open){
        start();
    }
}

function repo_init(){
    core_repo_init({
      'beforeunload': {
        'todo': function(event){
            if(!game_over){
                event.preventDefault();
            }
        },
      },
      'events': {
        'reset_camera': {
          'onclick': function(){
              reset_camera();
              core_escape();
          },
        },
        'start': {
          'onclick': start,
        },
      },
      'globals': {
        'camera_x': 0,
        'camera_y': 0,
        'game_over': true,
        'hexagon_size': 0,
        'input_required': false,
        'player_ids': [],
        'position_x': 0,
        'position_y': 0,
        'scoreboard': [],
        'turn': 0,
        'turn_limit_string': '',
        'turns': 0,
        'unclaimed': 0,
        'x_scaled': 0,
        'x_scaled_half': 0,
        'y_scaled': 0,
        'y_scaled_double': 0,
        'y_scaled_half': 0,
      },
      'info': '<button id=start type=button>Start New Game</button><button id=reset_camera type=button>Reset Camera</button>',
      'menu': true,
      'pointerbinds': {
        'pointerup': {
          'todo': function(){
              if(!entity_entities[player_ids[turn]]
                || entity_entities[player_ids[turn]].ai){
                  return;
              }

              const position = update_position();

              let target = false;
              entity_group_modify({
                'groups': [
                  'hexagon',
                ],
                'todo': function(entity){
                    if(entity.x === position.x
                     && entity.y === position.y
                     && entity.color !== entity_entities[player_ids[turn]].color){
                        target = entity.id;
                    }
                },
              });
              if(target === false){
                  return;
              }

              if(!check_neighbor_match(entity_entities[target].x, entity_entities[target].y)){
                  return;
              }

              conquer_hexagon(target);

              input_required = false;
          },
        },
        'pointermove': {
          'todo': update_position,
        },
      },
      'storage': {
        'ai': 4,
        'height': 500,
        'hexagon_count': 150,
        'hexagon_size': 25,
        'players': 1,
        'scroll_speed': 5,
        'turn_limit': 0,
        'unclaimed_color': '#ffffff',
        'width': 500,
      },
      'storage-controls': true,
      'storage-menu': '<table><tr><td><input class=mini id=ai min=0 step=1 type=number><td>AI'
        + '<tr><td><input class=mini id=height min=1 step=any type=number><td>Height'
        + '<tr><td><input class=mini id=hexagon_count min=1 step=1 type=number><td>Hexagons'
        + '<tr><td><input class=mini id=hexagon_size min=1 step=any type=number><td>Hexagon Size'
        + '<tr><td><input class=mini id=players min=0 step=1 type=number><td>Players'
        + '<tr><td><input class=mini id=scroll_speed min=1 step=any type=number><td>Scroll Speed'
        + '<tr><td><input class=mini id=turn_limit min=0 step=any type=number><td>Turn Limit'
        + '<tr><td><input id=unclaimed_color type=color><td>Unclaimed Color'
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
        'hexagon_count': 0,
        'name': '',
      },
      'type': 'player',
    });
    canvas_init({
      'cursor': 'pointer',
    });
}

function repo_logic(){
    if(!entity_entities[player_ids[turn]]){
        return;
    }

    if(core_pointer['down-0']){
        camera_x -= core_pointer['movement-x'];
        camera_y -= core_pointer['movement-y'];
    }

    if(core_keys[core_storage_data['move-←']].state){
        camera_x -= core_storage_data.scroll_speed;
    }
    if(core_keys[core_storage_data['move-→']].state){
        camera_x += core_storage_data.scroll_speed;
    }
    if(core_keys[core_storage_data['move-↓']].state){
        camera_y += core_storage_data.scroll_speed;
    }
    if(core_keys[core_storage_data['move-↑']].state){
        camera_y -= core_storage_data.scroll_speed;
    }

    handle_turn();

    core_ui_update({
      'ids': {
        'turn': turns + turn_limit_string + ' ' + entity_entities[player_ids[turn]].name,
        'unclaimed': unclaimed,
      },
    });
}

function reset_camera(){
    camera_x = core_storage_data.width / 2;
    camera_y = core_storage_data.height / 2;
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

function start(){
    if(!game_over
      && !globalThis.confirm('Start new game?')){
        return;
    }
    canvas_setmode();
}

function update_position(){
   const x = core_pointer.x - canvas_properties.width_half + camera_x;
   const y = core_pointer.y - canvas_properties.height_half + camera_y;
   const position = select_hexagon(
     select_y_mod(
       x,
       y
     ),
     y
   );
   position_x = position.x;
   position_y = position.y;
   return position;
}

function update_scoreboard(){
    core_object_reset(scoreboard);
    entity_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          scoreboard.push({
            'hexagon_count': entity.hexagon_count,
            'id': entity.id,
          });
      },
    });
    scoreboard = core_sort_property({
      'array': scoreboard,
      'property': 'hexagon_count',
      'reverse': true,
    });
}
