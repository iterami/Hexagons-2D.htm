'use strict';

function create_hexagon(x, y){
    x = Math.ceil((x - 20) / 40) * 40;
    y = Math.ceil((y - 20) / 40) * 40;
    if(y % 80){
        x += 20;
    }

    hexagons.push({
      'color': '#fff',
      'x': x,
      'y': y,
    });
}

function draw_logic(){
    // Save the current buffer state.
    canvas_buffer.save();

    for(var hexagon in hexagons){
        canvas_buffer.fillStyle = hexagons[hexagon]['color'];
        canvas_buffer.beginPath();
        for(var i = 0; i < 6; i++){
            var angle = math_degrees_to_radians(30 + i * 60);
            canvas_buffer[i === 0
              ? 'moveTo'
              : 'lineTo'
            ](
              hexagons[hexagon]['x'] + Math.cos(angle) * 25,
              hexagons[hexagon]['y'] + Math.sin(angle) * 25
            );
        }
        canvas_buffer.closePath();
        canvas_buffer.fill();
    }
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
              create_hexagon(
                input_mouse['x'],
                input_mouse['y']
              );
          },
        },
      }
    );
};
