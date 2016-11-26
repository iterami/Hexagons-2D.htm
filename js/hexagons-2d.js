'use strict';

function draw_logic(){
    // Save the current buffer state.
    canvas_buffer.save();

    for(var hexagon in hexagons){
        var vertices = [];
        for(var i = 0; i < 6; i++){
            var angle = math_degrees_to_radians(30 + i * 60);
            vertices.push({
              'type': i === 0
                ? 'moveTo'
                : 'lineTo',
              'x': hexagons[hexagon]['x'] + Math.cos(angle) * 25,
              'y': hexagons[hexagon]['y'] + Math.sin(angle) * 25,
            });
        }
        canvas_draw_path(
          vertices,
          {
            'fillStyle': hexagons[hexagon]['color'],
          }
        );
    }
}

function toggle_hexagon(x, y){
    var side = x % 46 < 23
      ? 23
      : -23;
    x = Math.ceil((x - 23) / 46) * 46;
    y = Math.ceil((y - 20) / 40) * 40;
    if(y % 80){
        x += side;
    }

    // Delete hexagon if one exists on this spot.
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['x'] === x
          && hexagons[hexagon]['y'] === y){
            delete hexagons[hexagon];
            return;
        }
    }

    hexagons.push({
      'color': '#fff',
      'x': x,
      'y': y,
    });
}

var hexagons = [];

window.onload = function(){
    canvas_init();
    input_init(
      {
        27: {
          'todo': function(){
              hexagons.length = 0;
          },
        },
      },
      {
        'mousedown': {
          'todo': function(){
              toggle_hexagon(
                input_mouse['x'],
                input_mouse['y']
              );
          },
        },
        'mousemove': {
          'todo': function(){
              if(!input_mouse['down']){
                  return;
              }

              toggle_hexagon(
                input_mouse['x'],
                input_mouse['y']
              );
          },
        },
      }
    );
};
