'use strict';

function load_level(id){
    // Create base hexagons.
    var loop_counter = settings_settings['hexagons'] - 1;
    do{
        toggle_hexagon(
          random_integer(500) - 250,
          random_integer(500) - 250
        );
    }while(loop_counter--);

    // Create players.
    loop_counter = Math.min(
      settings_settings['hexagons'],
      settings_settings['players']
    ) - 1;
    do{
        var hexagon = random_integer(hexagons.length);
        while(hexagons[hexagon]['color'] !== '#fff'){
            hexagon = random_integer(hexagons.length);
        }
        hexagons[hexagon]['color'] = random_hex();
    }while(loop_counter--);
}
