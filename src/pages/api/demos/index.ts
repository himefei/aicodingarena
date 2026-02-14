import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

// Pygame shim: a browser-compatible mock of pygame that renders to HTML5 Canvas.
// Supports: display, draw, event, time, font, key, mouse, Rect, Color, Surface, transform, image, mixer (stub)
const PYGAME_SHIM = `
import sys as _sys
import math as _math
from js import document as _document, window as _window, setTimeout as _setTimeout
from pyodide.ffi import create_proxy as _create_proxy

# ── Constants ──────────────────────────────────────────────
QUIT = 256
KEYDOWN = 768
KEYUP = 769
MOUSEBUTTONDOWN = 1025
MOUSEBUTTONUP = 1026
MOUSEMOTION = 1024
K_UP = 273; K_DOWN = 274; K_LEFT = 276; K_RIGHT = 275
K_SPACE = 32; K_RETURN = 13; K_ESCAPE = 27
K_a = 97; K_b = 98; K_c = 99; K_d = 100; K_e = 101; K_f = 102
K_g = 103; K_h = 104; K_i = 105; K_j = 106; K_k = 107; K_l = 108
K_m = 109; K_n = 110; K_o = 111; K_p = 112; K_q = 113; K_r = 114
K_s = 115; K_t = 116; K_u = 117; K_v = 118; K_w = 119; K_x = 120
K_y = 121; K_z = 122
K_0 = 48; K_1 = 49; K_2 = 50; K_3 = 51; K_4 = 52
K_5 = 53; K_6 = 54; K_7 = 55; K_8 = 56; K_9 = 57
SRCALPHA = 0x00010000
FULLSCREEN = 0; RESIZABLE = 0; NOFRAME = 0; DOUBLEBUF = 0; HWSURFACE = 0

# ── Helpers ────────────────────────────────────────────────
def _parse_color(c):
    if isinstance(c, Color):
        return c.r, c.g, c.b, c.a
    if isinstance(c, (list, tuple)):
        r, g, b = c[0], c[1], c[2]
        a = c[3] if len(c) > 3 else 255
        return r, g, b, a
    if isinstance(c, str):
        c = c.lstrip('#')
        if len(c) == 6:
            return int(c[0:2],16), int(c[2:4],16), int(c[4:6],16), 255
        if len(c) == 8:
            return int(c[0:2],16), int(c[2:4],16), int(c[4:6],16), int(c[6:8],16)
    if isinstance(c, int):
        return c, c, c, 255
    return 255, 255, 255, 255

def _css(c):
    r, g, b, a = _parse_color(c)
    if a == 255:
        return f"rgb({r},{g},{b})"
    return f"rgba({r},{g},{b},{a/255:.3f})"

# ── Color ──────────────────────────────────────────────────
class Color:
    def __init__(self, *args):
        if len(args) == 1 and isinstance(args[0], str):
            cn = args[0].lower()
            _map = {'red':(255,0,0),'green':(0,128,0),'blue':(0,0,255),'white':(255,255,255),
                    'black':(0,0,0),'yellow':(255,255,0),'cyan':(0,255,255),'magenta':(255,0,255),
                    'orange':(255,165,0),'purple':(128,0,128),'pink':(255,192,203),'gray':(128,128,128),
                    'grey':(128,128,128),'brown':(165,42,42),'navy':(0,0,128),'lime':(0,255,0)}
            if cn in _map:
                self.r, self.g, self.b = _map[cn]; self.a = 255
            elif cn.startswith('#'):
                self.r, self.g, self.b, self.a = _parse_color(cn)
            else:
                self.r=self.g=self.b=0; self.a=255
        elif len(args) >= 3:
            self.r, self.g, self.b = int(args[0]), int(args[1]), int(args[2])
            self.a = int(args[3]) if len(args) > 3 else 255
        elif len(args) == 1 and isinstance(args[0], (list,tuple)):
            self.r, self.g, self.b = int(args[0][0]), int(args[0][1]), int(args[0][2])
            self.a = int(args[0][3]) if len(args[0]) > 3 else 255
        else:
            self.r=self.g=self.b=0; self.a=255
    def __iter__(self):
        return iter((self.r, self.g, self.b, self.a))
    def __getitem__(self, i):
        return (self.r, self.g, self.b, self.a)[i]
    def __len__(self):
        return 4

# ── Rect ───────────────────────────────────────────────────
class Rect:
    def __init__(self, *args):
        if len(args) == 1:
            if isinstance(args[0], Rect):
                self.x, self.y, self.w, self.h = args[0].x, args[0].y, args[0].w, args[0].h
            elif isinstance(args[0], (list, tuple)) and len(args[0]) == 4:
                self.x, self.y, self.w, self.h = args[0]
            else:
                self.x=self.y=self.w=self.h=0
        elif len(args) == 2:
            self.x, self.y = args[0][0], args[0][1]
            self.w, self.h = args[1][0], args[1][1]
        elif len(args) == 4:
            self.x, self.y, self.w, self.h = args
        else:
            self.x=self.y=self.w=self.h=0
        self.x, self.y, self.w, self.h = int(self.x), int(self.y), int(self.w), int(self.h)
    @property
    def left(self): return self.x
    @left.setter
    def left(self, v): self.x = int(v)
    @property
    def top(self): return self.y
    @top.setter
    def top(self, v): self.y = int(v)
    @property
    def right(self): return self.x + self.w
    @right.setter
    def right(self, v): self.x = int(v) - self.w
    @property
    def bottom(self): return self.y + self.h
    @bottom.setter
    def bottom(self, v): self.y = int(v) - self.h
    @property
    def width(self): return self.w
    @width.setter
    def width(self, v): self.w = int(v)
    @property
    def height(self): return self.h
    @height.setter
    def height(self, v): self.h = int(v)
    @property
    def size(self): return (self.w, self.h)
    @property
    def center(self): return (self.x + self.w // 2, self.y + self.h // 2)
    @center.setter
    def center(self, v): self.x = int(v[0]) - self.w // 2; self.y = int(v[1]) - self.h // 2
    @property
    def centerx(self): return self.x + self.w // 2
    @centerx.setter
    def centerx(self, v): self.x = int(v) - self.w // 2
    @property
    def centery(self): return self.y + self.h // 2
    @centery.setter
    def centery(self, v): self.y = int(v) - self.h // 2
    @property
    def topleft(self): return (self.x, self.y)
    @topleft.setter
    def topleft(self, v): self.x, self.y = int(v[0]), int(v[1])
    @property
    def topright(self): return (self.x + self.w, self.y)
    @topright.setter
    def topright(self, v): self.x = int(v[0]) - self.w; self.y = int(v[1])
    @property
    def bottomleft(self): return (self.x, self.y + self.h)
    @bottomleft.setter
    def bottomleft(self, v): self.x = int(v[0]); self.y = int(v[1]) - self.h
    @property
    def bottomright(self): return (self.x + self.w, self.y + self.h)
    @bottomright.setter
    def bottomright(self, v): self.x = int(v[0]) - self.w; self.y = int(v[1]) - self.h
    @property
    def midtop(self): return (self.x + self.w // 2, self.y)
    @property
    def midbottom(self): return (self.x + self.w // 2, self.y + self.h)
    @property
    def midleft(self): return (self.x, self.y + self.h // 2)
    @property
    def midright(self): return (self.x + self.w, self.y + self.h // 2)
    def copy(self): return Rect(self.x, self.y, self.w, self.h)
    def move(self, dx, dy): return Rect(self.x + dx, self.y + dy, self.w, self.h)
    def move_ip(self, dx, dy): self.x += int(dx); self.y += int(dy)
    def inflate(self, dx, dy): return Rect(self.x - dx//2, self.y - dy//2, self.w + dx, self.h + dy)
    def inflate_ip(self, dx, dy): self.x -= dx//2; self.y -= dy//2; self.w += dx; self.h += dy
    def colliderect(self, other):
        if isinstance(other, (list, tuple)): other = Rect(other)
        return self.x < other.x + other.w and self.x + self.w > other.x and self.y < other.y + other.h and self.y + self.h > other.y
    def collidepoint(self, *args):
        if len(args) == 1: px, py = args[0][0], args[0][1]
        else: px, py = args[0], args[1]
        return self.x <= px < self.x + self.w and self.y <= py < self.y + self.h
    def contains(self, other):
        if isinstance(other, (list, tuple)): other = Rect(other)
        return self.x <= other.x and self.y <= other.y and self.x + self.w >= other.x + other.w and self.y + self.h >= other.y + other.h
    def clamp(self, other):
        r = self.copy()
        if r.w > other.w: r.x = other.x + (other.w - r.w) // 2
        elif r.x < other.x: r.x = other.x
        elif r.right > other.right: r.right = other.right
        if r.h > other.h: r.y = other.y + (other.h - r.h) // 2
        elif r.y < other.y: r.y = other.y
        elif r.bottom > other.bottom: r.bottom = other.bottom
        return r
    def union(self, other):
        x = min(self.x, other.x); y = min(self.y, other.y)
        return Rect(x, y, max(self.right, other.right) - x, max(self.bottom, other.bottom) - y)
    def __repr__(self):
        return f"<rect({self.x}, {self.y}, {self.w}, {self.h})>"
    def __iter__(self):
        return iter((self.x, self.y, self.w, self.h))
    def __getitem__(self, i):
        return (self.x, self.y, self.w, self.h)[i]
    def __len__(self):
        return 4

# ── Surface ────────────────────────────────────────────────
class Surface:
    def __init__(self, size, flags=0, depth=32):
        self._w = int(size[0])
        self._h = int(size[1])
        self._flags = flags
        self._canvas = _document.createElement('canvas')
        self._canvas.width = self._w
        self._canvas.height = self._h
        self._ctx = self._canvas.getContext('2d')
        if flags & SRCALPHA:
            self._ctx.clearRect(0, 0, self._w, self._h)
        else:
            self._ctx.fillStyle = 'rgb(0,0,0)'
            self._ctx.fillRect(0, 0, self._w, self._h)
    def get_size(self):
        return (self._w, self._h)
    def get_width(self):
        return self._w
    def get_height(self):
        return self._h
    def get_rect(self, **kwargs):
        r = Rect(0, 0, self._w, self._h)
        for k, v in kwargs.items():
            setattr(r, k, v)
        return r
    def fill(self, color, rect=None):
        self._ctx.fillStyle = _css(color)
        if rect:
            if isinstance(rect, Rect):
                self._ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            else:
                self._ctx.fillRect(rect[0], rect[1], rect[2], rect[3])
        else:
            self._ctx.fillRect(0, 0, self._w, self._h)
    def blit(self, source, dest, area=None):
        dx, dy = (dest[0], dest[1]) if isinstance(dest, (list, tuple)) else (dest.x, dest.y)
        if area:
            if isinstance(area, Rect):
                sx, sy, sw, sh = area.x, area.y, area.w, area.h
            else:
                sx, sy, sw, sh = area[0], area[1], area[2], area[3]
            self._ctx.drawImage(source._canvas, sx, sy, sw, sh, dx, dy, sw, sh)
        else:
            self._ctx.drawImage(source._canvas, dx, dy)
        return Rect(int(dx), int(dy), source._w, source._h)
    def set_at(self, pos, color):
        r, g, b, a = _parse_color(color)
        self._ctx.fillStyle = _css(color)
        self._ctx.fillRect(int(pos[0]), int(pos[1]), 1, 1)
    def get_at(self, pos):
        d = self._ctx.getImageData(int(pos[0]), int(pos[1]), 1, 1).data
        return Color(d[0], d[1], d[2], d[3])
    def set_alpha(self, a):
        self._alpha = a
    def set_colorkey(self, color):
        self._colorkey = color
    def convert(self):
        return self
    def convert_alpha(self):
        return self
    def copy(self):
        s = Surface((self._w, self._h), self._flags)
        s._ctx.drawImage(self._canvas, 0, 0)
        return s
    def subsurface(self, rect):
        if isinstance(rect, (list, tuple)):
            rect = Rect(*rect) if len(rect) == 4 else Rect(rect)
        s = Surface((rect.w, rect.h), SRCALPHA)
        s._ctx.drawImage(self._canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
        return s
    def get_abs_offset(self):
        return (0, 0)

# ── Event system ───────────────────────────────────────────
class _Event:
    def __init__(self, etype, **kwargs):
        self.type = etype
        self.__dict__.update(kwargs)
    def __repr__(self):
        return f"<Event({self.type})>"

class _EventModule:
    def __init__(self):
        self._queue = []
        self._frame_count = 0
        self._max_frames = 1800
    def get(self, *args):
        self._frame_count += 1
        events = list(self._queue)
        self._queue.clear()
        if self._frame_count >= self._max_frames:
            events.append(_Event(QUIT))
        return events
    def poll(self):
        if self._queue:
            return self._queue.pop(0)
        self._frame_count += 1
        if self._frame_count >= self._max_frames:
            return _Event(QUIT)
        return _Event(0)
    def peek(self, *args):
        return len(self._queue) > 0
    def pump(self):
        pass
    def set_allowed(self, *a): pass
    def set_blocked(self, *a): pass
    def Event(self, etype, **kwargs):
        return _Event(etype, **kwargs)
    def post(self, ev):
        self._queue.append(ev)

event = _EventModule()

# ── Display ────────────────────────────────────────────────
class _DisplayModule:
    def __init__(self):
        self._surface = None
        self._canvas = None
        self._ctx = None
        self._caption = 'Pygame'
    def set_mode(self, size=(640, 480), flags=0, depth=32):
        w, h = int(size[0]), int(size[1])
        container = _document.getElementById('canvas-container')
        container.style.display = 'flex'
        self._canvas = _document.createElement('canvas')
        self._canvas.width = w
        self._canvas.height = h
        self._canvas.style.border = '1px solid #333'
        self._canvas.style.background = '#000'
        container.appendChild(self._canvas)
        self._ctx = self._canvas.getContext('2d')
        self._surface = Surface((w, h))
        # Hook input events
        _proxy_kd = _create_proxy(self._on_keydown)
        _proxy_ku = _create_proxy(self._on_keyup)
        _proxy_md = _create_proxy(self._on_mousedown)
        _proxy_mu = _create_proxy(self._on_mouseup)
        _proxy_mm = _create_proxy(self._on_mousemove)
        _document.addEventListener('keydown', _proxy_kd)
        _document.addEventListener('keyup', _proxy_ku)
        self._canvas.addEventListener('mousedown', _proxy_md)
        self._canvas.addEventListener('mouseup', _proxy_mu)
        self._canvas.addEventListener('mousemove', _proxy_mm)
        return self._surface
    def _on_keydown(self, e):
        event._queue.append(_Event(KEYDOWN, key=e.keyCode, unicode=e.key, mod=0))
        key._pressed[e.keyCode] = True
    def _on_keyup(self, e):
        event._queue.append(_Event(KEYUP, key=e.keyCode, mod=0))
        key._pressed[e.keyCode] = False
    def _on_mousedown(self, e):
        r = self._canvas.getBoundingClientRect()
        pos = (int(e.clientX - r.left), int(e.clientY - r.top))
        event._queue.append(_Event(MOUSEBUTTONDOWN, pos=pos, button=e.button + 1))
    def _on_mouseup(self, e):
        r = self._canvas.getBoundingClientRect()
        pos = (int(e.clientX - r.left), int(e.clientY - r.top))
        event._queue.append(_Event(MOUSEBUTTONUP, pos=pos, button=e.button + 1))
    def _on_mousemove(self, e):
        r = self._canvas.getBoundingClientRect()
        mouse._pos = (int(e.clientX - r.left), int(e.clientY - r.top))
    def flip(self):
        if self._ctx and self._surface:
            self._ctx.drawImage(self._surface._canvas, 0, 0)
    def update(self, *args):
        self.flip()
    def set_caption(self, title, icontitle=''):
        self._caption = title
    def get_surface(self):
        return self._surface
    def get_size(self):
        if self._surface:
            return self._surface.get_size()
        return (0, 0)
    def Info(self):
        class _Info:
            def __init__(s):
                s.current_w = 0; s.current_h = 0
        return _Info()

display = _DisplayModule()

# ── Draw ───────────────────────────────────────────────────
class _DrawModule:
    def rect(self, surface, color, rect, width=0, border_radius=0):
        ctx = surface._ctx
        if isinstance(rect, Rect):
            x, y, w, h = rect.x, rect.y, rect.w, rect.h
        elif isinstance(rect, (list, tuple)):
            if len(rect) == 4:
                x, y, w, h = rect
            else:
                x, y = rect[0]; w, h = rect[1]
        else:
            x, y, w, h = rect
        if border_radius > 0:
            ctx.beginPath()
            r = min(border_radius, w//2, h//2)
            ctx.moveTo(x + r, y)
            ctx.arcTo(x + w, y, x + w, y + h, r)
            ctx.arcTo(x + w, y + h, x, y + h, r)
            ctx.arcTo(x, y + h, x, y, r)
            ctx.arcTo(x, y, x + w, y, r)
            ctx.closePath()
            if width == 0:
                ctx.fillStyle = _css(color)
                ctx.fill()
            else:
                ctx.strokeStyle = _css(color)
                ctx.lineWidth = width
                ctx.stroke()
        else:
            if width == 0:
                ctx.fillStyle = _css(color)
                ctx.fillRect(x, y, w, h)
            else:
                ctx.strokeStyle = _css(color)
                ctx.lineWidth = width
                ctx.strokeRect(x + width/2, y + width/2, w - width, h - width)
        return Rect(int(x), int(y), int(w), int(h))
    def circle(self, surface, color, center, radius, width=0):
        ctx = surface._ctx
        cx, cy = int(center[0]), int(center[1])
        r = int(radius)
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, 2 * _math.pi)
        if width == 0:
            ctx.fillStyle = _css(color)
            ctx.fill()
        else:
            ctx.strokeStyle = _css(color)
            ctx.lineWidth = width
            ctx.stroke()
        return Rect(cx - r, cy - r, r * 2, r * 2)
    def line(self, surface, color, start, end, width=1):
        ctx = surface._ctx
        ctx.beginPath()
        ctx.moveTo(start[0], start[1])
        ctx.lineTo(end[0], end[1])
        ctx.strokeStyle = _css(color)
        ctx.lineWidth = width
        ctx.lineCap = 'round'
        ctx.stroke()
        x = min(start[0], end[0]); y = min(start[1], end[1])
        return Rect(x, y, abs(end[0]-start[0])+1, abs(end[1]-start[1])+1)
    def lines(self, surface, color, closed, points, width=1):
        ctx = surface._ctx
        if len(points) < 2:
            return Rect(0,0,0,0)
        ctx.beginPath()
        ctx.moveTo(points[0][0], points[0][1])
        for p in points[1:]:
            ctx.lineTo(p[0], p[1])
        if closed:
            ctx.closePath()
        ctx.strokeStyle = _css(color)
        ctx.lineWidth = width
        ctx.stroke()
        xs = [p[0] for p in points]; ys = [p[1] for p in points]
        return Rect(min(xs), min(ys), max(xs)-min(xs)+1, max(ys)-min(ys)+1)
    def aaline(self, surface, color, start, end, blend=1):
        return self.line(surface, color, start, end, 1)
    def aalines(self, surface, color, closed, points, blend=1):
        return self.lines(surface, color, closed, points, 1)
    def polygon(self, surface, color, points, width=0):
        ctx = surface._ctx
        if len(points) < 3:
            return Rect(0,0,0,0)
        ctx.beginPath()
        ctx.moveTo(points[0][0], points[0][1])
        for p in points[1:]:
            ctx.lineTo(p[0], p[1])
        ctx.closePath()
        if width == 0:
            ctx.fillStyle = _css(color)
            ctx.fill()
        else:
            ctx.strokeStyle = _css(color)
            ctx.lineWidth = width
            ctx.stroke()
        xs = [p[0] for p in points]; ys = [p[1] for p in points]
        return Rect(min(xs), min(ys), max(xs)-min(xs)+1, max(ys)-min(ys)+1)
    def ellipse(self, surface, color, rect, width=0):
        ctx = surface._ctx
        if isinstance(rect, Rect):
            x, y, w, h = rect.x, rect.y, rect.w, rect.h
        else:
            x, y, w, h = rect[0], rect[1], rect[2], rect[3]
        cx, cy = x + w/2, y + h/2
        ctx.beginPath()
        ctx.ellipse(cx, cy, w/2, h/2, 0, 0, 2*_math.pi)
        if width == 0:
            ctx.fillStyle = _css(color)
            ctx.fill()
        else:
            ctx.strokeStyle = _css(color)
            ctx.lineWidth = width
            ctx.stroke()
        return Rect(x, y, w, h)
    def arc(self, surface, color, rect, start_angle, stop_angle, width=1):
        ctx = surface._ctx
        if isinstance(rect, Rect):
            x, y, w, h = rect.x, rect.y, rect.w, rect.h
        else:
            x, y, w, h = rect[0], rect[1], rect[2], rect[3]
        cx, cy = x + w/2, y + h/2
        ctx.beginPath()
        ctx.ellipse(cx, cy, w/2, h/2, 0, -start_angle, -stop_angle, True)
        ctx.strokeStyle = _css(color)
        ctx.lineWidth = width
        ctx.stroke()
        return Rect(x, y, w, h)

draw = _DrawModule()

# ── Font ───────────────────────────────────────────────────
class _FontModule:
    _inited = False
    def init(self):
        self._inited = True
    def quit(self):
        pass
    def get_init(self):
        return True
    def SysFont(self, name, size, bold=False, italic=False):
        return Font(None, size, bold=bold, italic=italic)
    def Font(self, path, size):
        return Font(path, size)
    def get_fonts(self):
        return ['arial','courier','times']

class Font:
    def __init__(self, path=None, size=24, bold=False, italic=False):
        self._size = int(size)
        self._bold = bold
        self._italic = italic
        self._family = 'sans-serif'
    def render(self, text, antialias=True, color=(255,255,255), background=None):
        style = ''
        if self._bold: style += 'bold '
        if self._italic: style += 'italic '
        font_str = f"{style}{self._size}px {self._family}"
        # Measure text
        tmp = _document.createElement('canvas')
        tc = tmp.getContext('2d')
        tc.font = font_str
        metrics = tc.measureText(str(text))
        w = int(metrics.width) + 4
        h = int(self._size * 1.4) + 4
        s = Surface((w, h), SRCALPHA)
        if background is not None:
            s.fill(background)
        else:
            s._ctx.clearRect(0, 0, w, h)
        s._ctx.font = font_str
        s._ctx.fillStyle = _css(color)
        s._ctx.textBaseline = 'top'
        s._ctx.fillText(str(text), 2, 2)
        return s
    def size(self, text):
        tmp = _document.createElement('canvas')
        tc = tmp.getContext('2d')
        tc.font = f"{self._size}px {self._family}"
        m = tc.measureText(str(text))
        return (int(m.width) + 4, int(self._size * 1.4) + 4)
    def get_height(self):
        return int(self._size * 1.4) + 4
    def get_linesize(self):
        return self.get_height()
    def set_bold(self, v):
        self._bold = v
    def set_italic(self, v):
        self._italic = v

font = _FontModule()

# ── Time ───────────────────────────────────────────────────
class _TimeModule:
    def get_ticks(self):
        return int(_window.performance.now())
    def delay(self, ms):
        pass
    def wait(self, ms):
        return ms
    def set_timer(self, event_type, millis, loops=0):
        pass
    def Clock(self):
        return _Clock()

class _Clock:
    def __init__(self):
        self._last = _window.performance.now()
        self._dt = 0
    def tick(self, fps=0):
        now = _window.performance.now()
        self._dt = now - self._last
        if fps > 0:
            target_ms = 1000.0 / fps
            remaining = target_ms - self._dt
            if remaining > 0:
                pass  # Cannot yield in sync code; browser paints after runPythonAsync ends
        self._last = _window.performance.now()
        return self._dt
    def get_time(self):
        return self._dt
    def get_fps(self):
        if self._dt > 0:
            return 1000 / self._dt
        return 0.0
    def get_rawtime(self):
        return self._dt

time = _TimeModule()

# ── Key ────────────────────────────────────────────────────
class _KeyModule:
    def __init__(self):
        self._pressed = {}
    def get_pressed(self):
        class _KeyState:
            def __init__(s, d):
                s._d = d
            def __getitem__(s, k):
                return s._d.get(k, False)
        return _KeyState(dict(self._pressed))
    def get_mods(self):
        return 0
    def set_repeat(self, *args):
        pass
    def get_focused(self):
        return True

key = _KeyModule()

# ── Mouse ──────────────────────────────────────────────────
class _MouseModule:
    def __init__(self):
        self._pos = (0, 0)
        self._visible = True
    def get_pos(self):
        return self._pos
    def get_pressed(self):
        return (False, False, False)
    def set_visible(self, v):
        self._visible = v
    def set_pos(self, pos):
        self._pos = pos
    def get_focused(self):
        return True

mouse = _MouseModule()

# ── Transform ──────────────────────────────────────────────
class _TransformModule:
    def scale(self, surface, size):
        s = Surface((int(size[0]), int(size[1])), SRCALPHA)
        s._ctx.drawImage(surface._canvas, 0, 0, int(size[0]), int(size[1]))
        return s
    def rotate(self, surface, angle):
        rad = _math.radians(angle)
        w, h = surface._w, surface._h
        nw = int(abs(w * _math.cos(rad)) + abs(h * _math.sin(rad)))
        nh = int(abs(w * _math.sin(rad)) + abs(h * _math.cos(rad)))
        s = Surface((nw, nh), SRCALPHA)
        s._ctx.clearRect(0, 0, nw, nh)
        s._ctx.save()
        s._ctx.translate(nw/2, nh/2)
        s._ctx.rotate(-rad)
        s._ctx.drawImage(surface._canvas, -w/2, -h/2)
        s._ctx.restore()
        return s
    def rotozoom(self, surface, angle, scale):
        rad = _math.radians(angle)
        w, h = int(surface._w * abs(scale)), int(surface._h * abs(scale))
        nw = int(abs(w * _math.cos(rad)) + abs(h * _math.sin(rad)))
        nh = int(abs(w * _math.sin(rad)) + abs(h * _math.cos(rad)))
        s = Surface((nw, nh), SRCALPHA)
        s._ctx.clearRect(0, 0, nw, nh)
        s._ctx.save()
        s._ctx.translate(nw/2, nh/2)
        s._ctx.rotate(-rad)
        s._ctx.scale(abs(scale), abs(scale))
        s._ctx.drawImage(surface._canvas, -surface._w/2, -surface._h/2)
        s._ctx.restore()
        return s
    def flip(self, surface, xbool, ybool):
        s = Surface((surface._w, surface._h), SRCALPHA)
        s._ctx.save()
        sx = -1 if xbool else 1
        sy = -1 if ybool else 1
        s._ctx.scale(sx, sy)
        dx = -surface._w if xbool else 0
        dy = -surface._h if ybool else 0
        s._ctx.drawImage(surface._canvas, dx, dy)
        s._ctx.restore()
        return s
    def smoothscale(self, surface, size):
        return self.scale(surface, size)
    def scale2x(self, surface):
        return self.scale(surface, (surface._w * 2, surface._h * 2))

transform = _TransformModule()

# ── Image (stub) ───────────────────────────────────────────
class _ImageModule:
    def load(self, path):
        # Return a small placeholder surface
        s = Surface((64, 64), SRCALPHA)
        s._ctx.fillStyle = '#444'
        s._ctx.fillRect(0, 0, 64, 64)
        s._ctx.fillStyle = '#aaa'
        s._ctx.font = '10px sans-serif'
        s._ctx.fillText('img', 20, 35)
        return s
    def save(self, surface, path):
        pass
    def tostring(self, surface, fmt):
        return b''
    def fromstring(self, data, size, fmt):
        return Surface(size)

image = _ImageModule()

# ── Mixer (stub) ───────────────────────────────────────────
class _MixerModule:
    def __init__(self):
        pass
    def init(self, *a, **kw):
        pass
    def quit(self):
        pass
    def pre_init(self, *a, **kw):
        pass
    def get_init(self):
        return True
    def set_num_channels(self, n):
        pass
    def Sound(self, *a):
        return _Sound()
    class Channel:
        def __init__(self, id=0): pass
        def play(self, *a): pass
        def stop(self): pass
    class music:
        @staticmethod
        def load(path): pass
        @staticmethod
        def play(loops=0, start=0.0): pass
        @staticmethod
        def stop(): pass
        @staticmethod
        def pause(): pass
        @staticmethod
        def unpause(): pass
        @staticmethod
        def set_volume(v): pass
        @staticmethod
        def get_busy(): return False

class _Sound:
    def play(self, loops=0): pass
    def stop(self): pass
    def set_volume(self, v): pass

mixer = _MixerModule()

# ── Math ──────────────────────────────────────────────────
class _MathModule:
    class Vector2:
        def __init__(self, x=0, y=0):
            if isinstance(x, (list, tuple)):
                self.x, self.y = float(x[0]), float(x[1])
            else:
                self.x, self.y = float(x), float(y)
        def __add__(self, o): return _MathModule.Vector2(self.x + o.x, self.y + o.y)
        def __sub__(self, o): return _MathModule.Vector2(self.x - o.x, self.y - o.y)
        def __mul__(self, s):
            if isinstance(s, (int, float)): return _MathModule.Vector2(self.x * s, self.y * s)
            return self.x * s.x + self.y * s.y
        def __rmul__(self, s): return self.__mul__(s)
        def __neg__(self): return _MathModule.Vector2(-self.x, -self.y)
        def __iter__(self): return iter((self.x, self.y))
        def __getitem__(self, i): return (self.x, self.y)[i]
        def __repr__(self): return f"<Vector2({self.x:.4f}, {self.y:.4f})>"
        def length(self): return _math.sqrt(self.x**2 + self.y**2)
        def length_squared(self): return self.x**2 + self.y**2
        def normalize(self):
            l = self.length()
            if l == 0: return _MathModule.Vector2(0, 0)
            return _MathModule.Vector2(self.x/l, self.y/l)
        def normalize_ip(self):
            l = self.length()
            if l > 0: self.x /= l; self.y /= l
        def rotate(self, angle):
            rad = _math.radians(angle)
            c, s = _math.cos(rad), _math.sin(rad)
            return _MathModule.Vector2(self.x*c - self.y*s, self.x*s + self.y*c)
        def angle_to(self, other):
            return _math.degrees(_math.atan2(other.y - self.y, other.x - self.x))
        def distance_to(self, other):
            return _math.sqrt((self.x-other.x)**2 + (self.y-other.y)**2)
        def copy(self): return _MathModule.Vector2(self.x, self.y)
        def dot(self, o): return self.x * o.x + self.y * o.y
        def cross(self, o): return self.x * o.y - self.y * o.x

math = _MathModule()

# ── Sprite ─────────────────────────────────────────────────
class _SpriteModule:
    class Sprite:
        def __init__(self, *groups):
            self.image = None
            self.rect = Rect(0,0,0,0)
            self._groups = set()
            for g in groups:
                g.add(self)
        def update(self, *args, **kwargs):
            pass
        def kill(self):
            for g in list(self._groups):
                g.remove(self)
        def alive(self):
            return len(self._groups) > 0
        def add(self, *groups):
            for g in groups:
                g.add(self)
    class Group:
        def __init__(self, *sprites):
            self._sprites = set()
            for s in sprites:
                self.add(s)
        def add(self, *sprites):
            for s in sprites:
                self._sprites.add(s)
                s._groups.add(self)
        def remove(self, *sprites):
            for s in sprites:
                self._sprites.discard(s)
                s._groups.discard(self)
        def sprites(self):
            return list(self._sprites)
        def update(self, *args, **kwargs):
            for s in list(self._sprites):
                s.update(*args, **kwargs)
        def draw(self, surface):
            for s in self._sprites:
                if s.image and s.rect:
                    surface.blit(s.image, s.rect)
        def empty(self):
            for s in list(self._sprites):
                self.remove(s)
        def __len__(self):
            return len(self._sprites)
        def __iter__(self):
            return iter(list(self._sprites))
        def __bool__(self):
            return len(self._sprites) > 0
    GroupSingle = Group
    def spritecollide(self, sprite, group, dokill):
        hits = []
        for s in group.sprites():
            if sprite.rect.colliderect(s.rect):
                hits.append(s)
                if dokill:
                    s.kill()
        return hits
    def groupcollide(self, ga, gb, dokilla, dokillb):
        res = {}
        for a in ga.sprites():
            hits = [b for b in gb.sprites() if a.rect.colliderect(b.rect)]
            if hits:
                res[a] = hits
                if dokilla: a.kill()
                if dokillb:
                    for b in hits: b.kill()
        return res
    def collide_rect(self, a, b):
        return a.rect.colliderect(b.rect)

sprite = _SpriteModule()

# ── Cursors (stub) ─────────────────────────────────────────
class _CursorsModule:
    def __getattr__(self, name):
        return lambda *a, **kw: None

cursors = _CursorsModule()

# ── mask (stub) ────────────────────────────────────────────
class _MaskModule:
    def from_surface(self, surface, threshold=127):
        class _Mask:
            def __init__(self, w, h):
                self.w, self.h = w, h
            def overlap(self, other, offset):
                return None
            def get_size(self):
                return (self.w, self.h)
        return _Mask(surface._w, surface._h)

mask = _MaskModule()

# ── Top-level functions ────────────────────────────────────
_inited = False
def init():
    global _inited
    _inited = True
    font.init()
    return (6, 0)

def quit():
    global _inited
    _inited = False

def get_init():
    return _inited

def get_error():
    return ''

# Version info
class _Version:
    major = 2; minor = 5; patch = 0
    def __repr__(self): return '2.5.0'
ver = '2.5.0'
version = _Version()

# Expose Surface and Rect at top level
__all__ = [
    'init', 'quit', 'get_init', 'display', 'draw', 'event', 'font',
    'time', 'key', 'mouse', 'image', 'transform', 'mixer', 'math',
    'sprite', 'mask', 'cursors',
    'Surface', 'Rect', 'Color', 'Font',
    'QUIT', 'KEYDOWN', 'KEYUP', 'MOUSEBUTTONDOWN', 'MOUSEBUTTONUP', 'MOUSEMOTION',
    'K_UP', 'K_DOWN', 'K_LEFT', 'K_RIGHT', 'K_SPACE', 'K_RETURN', 'K_ESCAPE',
    'K_a','K_b','K_c','K_d','K_e','K_f','K_g','K_h','K_i','K_j','K_k','K_l','K_m',
    'K_n','K_o','K_p','K_q','K_r','K_s','K_t','K_u','K_v','K_w','K_x','K_y','K_z',
    'K_0','K_1','K_2','K_3','K_4','K_5','K_6','K_7','K_8','K_9',
    'SRCALPHA', 'FULLSCREEN', 'RESIZABLE', 'NOFRAME', 'DOUBLEBUF', 'HWSURFACE',
]
`;

// Pyodide wrapper template for Python demos
export function wrapPythonAsHtml(pythonCode: string): string {
  // Detect which packages the code actually needs
  const usesPygame = /^(?:import\s+pygame|from\s+pygame)/m.test(pythonCode);
  const usesNumpy = /^(?:import\s+numpy|from\s+numpy)/m.test(pythonCode);

  // Find non-stdlib, non-shimmed packages that need micropip
  const skipSet = ['sys','os','io','math','random','json','re','time','datetime','collections','itertools','functools','string','typing','abc','copy','enum','pathlib','dataclasses','operator','contextlib','textwrap','struct','array','bisect','heapq','statistics','decimal','fractions','hashlib','hmac','secrets','base64','html','xml','csv','configparser','argparse','logging','unittest','pdb','traceback','gc','inspect','dis','ast','token','tokenize','codecs','unicodedata','locale','gettext','platform','ctypes','threading','multiprocessing','subprocess','socket','ssl','email','http','urllib','ftplib','smtplib','uuid','tempfile','shutil','glob','fnmatch','pickle','shelve','sqlite3','zipfile','tarfile','gzip','bz2','lzma','zlib','pprint','warnings','weakref','types','importlib','pygame','numpy','np'];
  const importPattern = /^(?:import|from)\s+(\w+)/gm;
  const micropipPackages: string[] = [];
  let match;
  while ((match = importPattern.exec(pythonCode)) !== null) {
    const pkg = match[1];
    if (!skipSet.includes(pkg) && !micropipPackages.includes(pkg)) {
      micropipPackages.push(pkg);
    }
  }
  const needsMicropip = micropipPackages.length > 0;

  // Build the list of Pyodide built-in packages to load in parallel
  const builtinPackages: string[] = [];
  if (usesNumpy) builtinPackages.push('numpy');
  if (needsMicropip) builtinPackages.push('micropip');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Python Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; color: #e0e0e0; font-family: 'Courier New', monospace; min-height: 100vh; }
    #loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 20px; }
    #loading .spinner { width: 48px; height: 48px; border: 3px solid #333; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .progress { font-size: 14px; color: #94a3b8; text-align: center; }
    .progress-bar { width: 200px; height: 4px; background: #333; border-radius: 2px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; transition: width 0.3s; width: 0%; }
    .timer { font-size: 12px; color: #64748b; margin-top: -8px; }
    #output { padding: 20px; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6; }
    #canvas-container { display: flex; justify-content: center; padding: 20px; }
    canvas { max-width: 100%; }
    .error { color: #ef4444; background: #1e1e2d; padding: 16px; border-radius: 8px; margin: 20px; border-left: 4px solid #ef4444; }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div class="progress">Loading Python runtime...</div>
    <div class="progress-bar"><div class="progress-bar-fill" id="pbar"></div></div>
    <div class="timer" id="timer"></div>
  </div>
  <div id="output" style="display:none;"></div>
  <div id="canvas-container" style="display:none;"></div>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"><\/script>
  <script>
    async function main() {
      const loadingEl = document.getElementById('loading');
      const progressEl = loadingEl.querySelector('.progress');
      const pbar = document.getElementById('pbar');
      const timerEl = document.getElementById('timer');
      const outputEl = document.getElementById('output');
      const t0 = performance.now();
      const updateTimer = () => { timerEl.textContent = ((performance.now()-t0)/1000).toFixed(1) + 's'; };
      const timerInterval = setInterval(updateTimer, 100);
      const setProgress = (pct, msg) => { pbar.style.width = pct + '%'; progressEl.textContent = msg; updateTimer(); };

      try {
        // Step 1: Load Pyodide core (heaviest step)
        setProgress(10, '⏳ Loading Python runtime (first load may take ~5s)...');
        const pyodide = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
        });
        setProgress(40, '✓ Python runtime ready');

        ${builtinPackages.length > 0 ? `// Step 2: Load built-in packages in ONE batch (parallel download)
        setProgress(50, '📦 Loading packages: ${builtinPackages.join(', ')}...');
        await pyodide.loadPackage(${JSON.stringify(builtinPackages)});
        setProgress(70, '✓ Packages loaded');` : '// No extra packages needed\n        setProgress(70, \'✓ Ready\');'}

        ${needsMicropip ? `// Step 2b: Install pip-only packages
        const micropip = pyodide.pyimport('micropip');
        ${micropipPackages.map((pkg, i) => `setProgress(${70 + Math.round((i+1)/(micropipPackages.length+1)*15)}, '📦 pip install ${pkg}...');\n        try { await micropip.install('${pkg}'); } catch(e) { console.warn('${pkg}:', e); }`).join('\n        ')}` : ''}

        ${usesPygame ? `// Step 3: Install pygame browser shim (instant, no download)
        setProgress(85, '🎮 Setting up pygame shim...');
        const pygameShim = ${JSON.stringify(PYGAME_SHIM)};
        try { pyodide.FS.mkdir('/lib/python3.12/site-packages/pygame'); } catch(e) {}
        pyodide.FS.writeFile('/lib/python3.12/site-packages/pygame/__init__.py', pygameShim);
        pyodide.FS.writeFile('/lib/python3.12/site-packages/pygame/locals.py', 'from pygame import *\\n');` : ''}

        // Step 4: Setup stdout/stderr capture
        setProgress(90, '🔧 Setting up environment...');
        pyodide.runPython(\`
import sys

class OutputCapture:
    def __init__(self):
        self.outputs = []
    def write(self, text):
        self.outputs.append(text)
        if text.strip():
            from js import document
            el = document.getElementById('output')
            if el:
                el.style.display = 'block'
                el.textContent += text
    def flush(self):
        pass

sys.stdout = OutputCapture()
sys.stderr = OutputCapture()
\`);

        // Step 5: Run user code
        setProgress(95, '🚀 Running code...');
        loadingEl.style.display = 'none';
        clearInterval(timerInterval);

        const code = ${JSON.stringify(pythonCode)};
        await pyodide.runPythonAsync(code);

      } catch (error) {
        clearInterval(timerInterval);
        loadingEl.style.display = 'none';
        outputEl.style.display = 'block';
        outputEl.innerHTML = '<div class="error">Error: ' + error.message + '<\\/div>';
      }
    }
    main();
  <\/script>
</body>
</html>`;
}

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const url = new URL(context.request.url);
  const tabId = url.searchParams.get('tab');

  try {
    let result;
    if (tabId) {
      result = await env.ARENA_DB.prepare(
        'SELECT * FROM demos WHERE tab_id = ? ORDER BY created_at DESC'
      ).bind(tabId).all();
    } else {
      result = await env.ARENA_DB.prepare(
        'SELECT * FROM demos ORDER BY created_at DESC'
      ).all();
    }
    return jsonResponse(result.results);
  } catch {
    return errorResponse('Failed to fetch demos');
  }
};

export const POST: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as {
      tab_id: string;
      model_key: string;
      model_name: string;
      demo_type: 'html' | 'python';
      code: string;
      thumbnail?: string;
      comment?: string;
    };

    const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fileKey = `demos/${id}/index.html`;

    let htmlContent: string;
    if (body.demo_type === 'python') {
      htmlContent = wrapPythonAsHtml(body.code);
    } else {
      htmlContent = body.code;
    }

    await env.ARENA_FILES.put(fileKey, htmlContent, {
      httpMetadata: { contentType: 'text/html' },
    });

    let thumbnailKey: string | null = null;
    if (body.thumbnail) {
      thumbnailKey = `demos/${id}/thumbnail.png`;
      const thumbData = Uint8Array.from(
        atob(body.thumbnail.replace(/^data:image\/\w+;base64,/, '')),
        c => c.charCodeAt(0)
      );
      await env.ARENA_FILES.put(thumbnailKey, thumbData, {
        httpMetadata: { contentType: 'image/png' },
      });
    }

    await env.ARENA_DB.prepare(
      'INSERT INTO demos (id, tab_id, model_name, model_key, file_r2_key, thumbnail_r2_key, demo_type, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, body.tab_id, body.model_name, body.model_key, fileKey, thumbnailKey, body.demo_type, body.comment || null).run();

    const demo = await env.ARENA_DB.prepare('SELECT * FROM demos WHERE id = ?').bind(id).first();
    return jsonResponse(demo, 201);
  } catch {
    return errorResponse('Failed to upload demo');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
