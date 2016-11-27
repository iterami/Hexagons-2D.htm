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

function logic(){
    if(canvas_menu){
        return;
    }
}

function setmode_logic(newgame){
    hexagons = [];
    turn = 0;

    // Main menu mode.
    if(canvas_mode === 0){
        document.body.innerHTML = '<div><div><a onclick=canvas_setmode(1,true)>New Game</a></div></div>'
          + '<div class=right><div><input disabled value=ESC>Menu<br>'
          + '<input id=end-turn-key>End Turn</div><hr>'
          + '<div><input id=height>Height<br>'
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

function toggle_hexagon(x, y){
    var side = x % 46 < 23
      ? 23
      : -23;
    x = Math.ceil((x - 23) / 46) * 46;
    y = Math.ceil((y - 20) / 40) * 40;
    if(y % 80){
        x += side;
    }

    // Modify hexagon if one exists at this x,y.
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['x'] === x
          && hexagons[hexagon]['y'] === y){
            return;
        }
    }

    hexagons.push({
      'color': default_color,
      'x': x,
      'y': y,
    });
}

var default_color = '#fff';
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
        if(turn === players.length - 1){
            turn = 0;

        }else{
            turn += 1;
        }

    }else if(key === 'Q'){
        canvas_menu_quit();
    }
};

window.onload = function(){
    settings_init(
      'Hexagons-2D.htm-',
      {
        'end-turn-key': 'H',
        'height': 500,
        'hexagons': 100,
        'players': 5,
        'width': 500,
      }
    );
    canvas_init();
};
