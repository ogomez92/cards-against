# cards-against

Juego de cartas multijugador online inspirado en "Cartas contra la humanidad"

Este es un fork que arregla muchos problemas de accesibilidad y que está preparado para montar en un servidor propio y no en un netlify.

### como montar el proyecto
tenemos dos componentes:
* un front-end hecho react y styled-components (carpeta www)
* un back-end hecho con nodejs y socket.io (carpeta api)

en ambas carpetas es necesario instalar las dependencias `node_modules` (con `npm install`. Esto solo es necesario hacerlo una vez.

Hay que cambiar, en el archivo src/config, el api y el socket.

Además si quieres usarlo en tu propio servidor hay que instalar Redis, eso en Ubuntu se hace con `apt install redis`.

Una vez hecho esto:

* para arrancar el backend con live-reload se usa el comando `npm run dev` en la carpeta `api`
* para arrancar el frontend con live-reload se usa el comando `npm start` en la carpeta `www`

#### Configurando el proxy

Yo lo tengo hecho con Caddy 2, os paso un ejemplo, podéis adaptarlo a Nginx, Apache o lo que queráis.

Con el Caddy nos olvidamos también del archivo de redirects, pero es necesario porque es una single Page Application con su propio ruteado y si no se va a liar.

```caddyfile
cartas.oriolgomez.com {
  rewrite /socket.io /socket.io/
  root * /home/cards-against/www/dist
	file_server
    route /api/* {
		uri strip_prefix /api
        reverse_proxy http://localhost:5000
	}
	
  handle_path /socket.io/* {
    rewrite * /socket.io{path}
    reverse_proxy localhost:5000
  }
  @notStatic {
    not path /api/*
    not path /socket*
    not file
  }

  rewrite @notStatic /index.html
}
```

### contribuciones

Todas las contribuciones son bienvenidas, tanto en forma de feedback (issue) como en forma de código (PR) siempre que se mantengan las reglas de estilo definidas via eslint
