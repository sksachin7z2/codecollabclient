import React from 'react';
import io from 'socket.io-client';
import query from 'query-string';
import './style.css';

class Board extends React.Component {
  a = query.parse(window.location.search);

  timeout;
  socket = io("https://codecollab7z2-8g25.onrender.com");

  ctx;
  isDrawing = false;
  emitDelay = 50; // Delay to emit canvas data every 50ms

  constructor(props) {
    super(props);

    this.socket.emit('joinwhite', { room: this.a.room });
    this.socket.on("canvas-data", (data) => {
      if (this.isDrawing) return;

      const image = new Image();
      const canvas = document.querySelector('#board');
      const ctx = canvas.getContext('2d');
      
      image.onload = () => {
        ctx.drawImage(image, 0, 0);
        this.isDrawing = false;
      };

      image.src = data;
    });
  }

  componentDidMount() {
    this.drawOnCanvas();
  }

  componentWillReceiveProps(newProps) {
    const canvas = document.querySelector('#board');
    this.ctx.strokeStyle = newProps.color;
    this.ctx.lineWidth = newProps.size;

    if (newProps.isclick) {
      this.ctx.fillStyle = newProps.bgcolor;
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.props.setStatus();
    }

    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      const base64ImageData = canvas.toDataURL("image/png");
      this.socket.emit("canvas-data", base64ImageData, this.a.room);
    }, this.emitDelay);
  }

  drawOnCanvas() {
    const canvas = document.querySelector('#board');
    this.ctx = canvas.getContext('2d');
    const ctx = this.ctx;

    const sketch = document.querySelector('#sketch');
    const sketchStyle = getComputedStyle(sketch);
    canvas.width = parseInt(sketchStyle.getPropertyValue('width'));
    canvas.height = parseInt(sketchStyle.getPropertyValue('height'));

    const mouse = { x: 0, y: 0 };
    const lastMouse = { x: 0, y: 0 };

    canvas.addEventListener('mousemove', (e) => {
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;

      mouse.x = e.pageX - canvas.offsetLeft;
      mouse.y = e.pageY - canvas.offsetTop;
    }, false);

    canvas.addEventListener('mousedown', () => {
      canvas.addEventListener('mousemove', onPaint, false);
    }, false);

    canvas.addEventListener('mouseup', () => {
      canvas.removeEventListener('mousemove', onPaint, false);
    }, false);

    const onPaint = () => {
      ctx.beginPath();
      ctx.moveTo(lastMouse.x, lastMouse.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.closePath();
      ctx.stroke();

      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        const base64ImageData = canvas.toDataURL("image/png");
        this.socket.emit("canvas-data", base64ImageData, this.a.room);
      }, this.emitDelay);
    };
  }

  render() {
    return (
      <div className="container sketch overflow-y-hidden" id="sketch">
        <canvas className="bg-white board h-[90vh] border border-black rounded-md" id="board"></canvas>
      </div>
    );
  }
}

export default Board;
