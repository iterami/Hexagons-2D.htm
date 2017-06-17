'use strict';

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
