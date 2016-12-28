'use strict';

function load_level(id){
    // Create base hexagons.
    var loop_counter = settings_settings['hexagons'] - 1;
    do{
        create_hexagon(
          select_hexagon(
            random_integer(settings_settings['width']) - settings_settings['width'] / 2,
            random_integer(settings_settings['height']) - settings_settings['height'] / 2
          ),
          25
        );
    }while(loop_counter--);

    // Create players.
    for(var i = settings_settings['players']; i > 0; i--){
        create_player();
    }

    // Create AI.
    for(var i = settings_settings['ai']; i > 0; i--){
        create_player({
          'ai': true,
        });
    }
}
