'use strict';

function load_level(id){
    // Create base hexagons.
    var loop_counter = settings_settings['hexagons'] - 1;
    do{
        toggle_hexagon(
          Math.ceil(random_integer(settings_settings['width']) - settings_settings['width'] / 2),
          Math.ceil(random_integer(settings_settings['height']) - settings_settings['height'] / 2)
        );
    }while(loop_counter--);

    // Create players.
    loop_counter = Math.min(
      settings_settings['hexagons'],
      settings_settings['players']
    ) - 1;
    do{
        var player = {
          'color': random_hex(),
        };

        var hexagon = random_integer(hexagons.length);
        while(hexagons[hexagon]['color'] !== default_color){
            hexagon = random_integer(hexagons.length);
        }
        hexagons[hexagon]['color'] = player['color'];

        players.push(player);
    }while(loop_counter--);
}
