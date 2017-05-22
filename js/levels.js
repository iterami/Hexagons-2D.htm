'use strict';

function load_level(id){
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
}
