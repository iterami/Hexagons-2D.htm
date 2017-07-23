'use strict';

function check_done(id){
    var options = [];

    for(var hexagon in hexagons){
        if(hexagons[hexagon]['color'] === players[id]['color']){
            continue;
        }

        if(check_neighbor_match({
          'x': hexagons[hexagon]['x'],
          'y': hexagons[hexagon]['y'],
        })){
            if(hexagons[hexagon]['color'] === core_storage_data['default-color']){
                return hexagon;

            }else{
                options.push(hexagon);
            }
        }
    }

    if(options.length > 0){
        sort_random({
          'array': options,
        });
        for(var i = scoreboard.length; i--;){
            if(!players[scoreboard[i]['id']]){
                continue;
            }

            for(var option in options){
                if(hexagons[options[option]]['color'] === players[scoreboard[i]['id']]['color']){
                    return options[option];
                }
            }
        }

    }else{
        players[id]['done'] = true;
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
        for(var hexagon in hexagons){
            if(hexagons[hexagon]['x'] === new_next_position['x']
              && hexagons[hexagon]['y'] === new_next_position['y']
              && hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
                return true;
            }
        }
    }

    return false;
}

function conquer_hexagon(hexagon, playerid){
    playerid = playerid || player_ids[turn];

    if(hexagons[hexagon]['color'] !== players[playerid]['color']){
        if(hexagons[hexagon]['color'] === core_storage_data['default-color']){
            hexagons[hexagon]['color'] = players[playerid]['color'];
            players[playerid]['hexagons'] += 1;
            unclaimed -= 1;

        }else if(core_random_boolean()){
            var old_color = hexagons[hexagon]['color'];
            hexagons[hexagon]['color'] = players[playerid]['color'];
            players[playerid]['hexagons'] += 1;
            for(var player in players){
                if(old_color === players[player]['color']){
                    lose_hexagon(player);
                    break;
                }
            }
        }
    }
}

function create_hexagon(position, size){
    // Only create a hexagon if one doesn't already exist at this x,y.
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['x'] === position['x']
          && hexagons[hexagon]['y'] === position['y']){
            return;
        }
    }

    hexagons.push({
      'color': core_storage_data['default-color'],
      'size': size,
      'x': position['x'],
      'y': position['y'],
    });
    unclaimed = hexagons.length;
}

function create_player(properties){
    if(player_count > hexagons.length - 1){
        return;
    }

    properties = properties || {};
    properties = {
      'ai': properties['ai'] || false,
      'color': properties['color'] || '#' + core_random_hex(),
      'done': false,
      'hexagons': 0,
      'name': '',
    };
    properties['name'] = (properties['ai']
      ? 'AI'
      : 'P')
      + properties['color'];

    players[player_count] = properties;
    player_ids.push(player_count);

    var hexagon = core_random_integer({
      'max': hexagons.length,
    });
    while(hexagons[hexagon]['color'] !== core_storage_data['default-color']){
        hexagon = core_random_integer({
          'max': hexagons.length,
        });
    }
    conquer_hexagon(
      hexagon,
      player_count
    );

    check_done(player_count);
    player_count += 1;
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
    for(var player in players){
        if(!players[player]['done']){
            over = false;
            break;
        }
    }
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

    if(!players[player_ids[turn]]){
        end_turn();

    }else{
        input_required = !players[player_ids[turn]]['ai'];
        turns += 1;
    }
}

function handle_turn(){
    if(!players[player_ids[turn]]
      || (input_required && !players[player_ids[turn]]['done'])
      || game_over){
        return;
    }

    if(!players[player_ids[turn]]['done']){
        var target = check_done(player_ids[turn]);
        if(players[player_ids[turn]]['ai']
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
    hexagons = [];
    player_count = 0;
    player_ids = [];
    players = {};
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

    input_required = !players[player_ids[turn]]['ai'];
}

function lose_hexagon(player){
    players[player]['hexagons'] -= 1;
    if(players[player]['hexagons'] <= 0){
        delete players[player];
        player_count -= 1;
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
    for(var player in players){
        scoreboard.push({
          'hexagons': players[player]['hexagons'],
          'id': player,
        });
    }
    sort_property({
      'array': scoreboard,
      'property': 'hexagons',
      'reverse': true,
    });
}
