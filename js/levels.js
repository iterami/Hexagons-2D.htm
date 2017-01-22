'use strict';

function load_level(id){
    // Create base hexagons.
    var loop_counter = storage_data['hexagons'] - 1;
    do{
        create_hexagon(
          select_hexagon(
            random_integer({
              'max': storage_data['width'],
            }) - storage_data['width'] / 2,
            random_integer({
              'max': storage_data['height'],
            }) - storage_data['height'] / 2
          ),
          storage_data['hexagon-size']
        );
    }while(loop_counter--);

    // Create players.
    for(var i = storage_data['players']; i--;){
        create_player();
    }

    // Create AI.
    for(var i = storage_data['ai']; i--;){
        create_player({
          'ai': true,
        });
    }
}
