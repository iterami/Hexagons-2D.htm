'use strict';

function create_hexagon(x, y){
    // Only create a hexagon if one doesn't already exist at this x,y.
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['x'] === x
          && hexagons[hexagon]['y'] === y){
            return;
        }
    }

    hexagons.push({
      'color': settings_settings['default-color'],
      'x': x,
      'y': y,
    });
}

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
              'x': hexagons[hexagon]['x'] + Math.cos(angle) * 25 + canvas_x,
              'y': hexagons[hexagon]['y'] + Math.sin(angle) * 25 + canvas_y,
            });
        }
        canvas_draw_path(
          vertices,
          {
            'fillStyle': hexagons[hexagon]['color'],
          }
        );
    }

    canvas_buffer.fillStyle = players[turn]['color'];
    canvas_buffer.fillText(
      'Turn: ' + turn,
      0,
      25
    );
}

function end_turn(){
    if(turn === players.length - 1){
        turn = 0;

    }else{
        turn += 1;
    }
}

function logic(){
    if(canvas_menu){
        return;
    }
}

function select_hexagon(x, y){
    var side = x % 46 < 23
      ? 23
      : -23;
    x = Math.ceil((x - 23) / 46) * 46;
    y = Math.ceil((y - 20) / 40) * 40;
    if(y % 80){
        x += side;
    }

    return {
      'x': x,
      'y': y,
    };
}

function setmode_logic(newgame){
    hexagons = [];
    players = [];
    turn = 0;

    // Main menu mode.
    if(canvas_mode === 0){
        document.body.innerHTML = '<div><div><a onclick=canvas_setmode(1,true)>New Game</a></div></div>'
          + '<div class=right><div><input disabled value=ESC>Menu<br>'
          + '<input id=end-turn-key>End Turn</div><hr>'
          + '<div><input id=default-color>Default Color<br>'
          + '<input id=height>Height<br>'
          + '<input id=hexagons>Hexagons<br>'
          + '<input id=players>Players<br>'
          + '<div><input id=width>Width<br>'
          + '<a onclick=settings_reset()>Reset Settings</a></div></div>';
        settings_update();

    // New game mode.
    }else{
        if(newgame){
            settings_save();
        }
    }
}

var hexagons = [];
var players = [];
var turn = 0;

window.onkeydown = function(e){
    if(canvas_mode <= 0){
        return;
    }

    var key = e.keyCode || e.which;

    // ESC: return to main menu.
    if(key === 27){
        canvas_menu_toggle();
        return;
    }

    key = String.fromCharCode(key);

    if(key === settings_settings['end-turn-key']){
        end_turn();

    }else if(key === 'Q'){
        canvas_menu_quit();
    }
};

window.onmousedown = function(e){
    if(canvas_mode <= 0){
        return;
    }

    var position = select_hexagon(
      e.pageX - canvas_x,
      e.pageY - canvas_y
    );

    // Check if a hexagon exists at this location.
    var target = false;
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['x'] === position['x']
          && hexagons[hexagon]['y'] === position['y']){
            target = hexagon;
            break;
        }
    }
    if(target === false){
        return;
    }

    // Check if current player has a hexagon next to target hexagon.
    var next = false;
    var next_positions = [
      [50, 0,],
      [25, 25,],
      [-25, 25,],
      [-50, 0,],
      [-25, -25,],
      [25, -25,],
    ];
    for(var next_position in next_positions){
        var position = select_hexagon(
          hexagons[target]['x'] + next_positions[next_position][0],
          hexagons[target]['y'] + next_positions[next_position][1]
        );
        for(hexagon in hexagons){
            if(hexagons[hexagon]['x'] === position['x']
              && hexagons[hexagon]['y'] === position['y']
              && hexagons[hexagon]['color'] === players[turn]['color']){
                next = true;
                break;
            }
        }
    }
    if(next === false){
        return;
    }

    // Attempt to conquer the hexagon.
    if(hexagons[target]['color'] !== players[turn]['color']
      && (hexagons[target]['color'] === settings_settings['default-color']
      || random_boolean())){
        hexagons[target]['color'] = players[turn]['color'];
    }

    end_turn();
};

window.onload = function(){
    settings_init(
      'Hexagons-2D.htm-',
      {
        'default-color': '#fff',
        'end-turn-key': 'H',
        'height': 500,
        'hexagons': 100,
        'players': 5,
        'width': 500,
      }
    );
    canvas_init();
};
