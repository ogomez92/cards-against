# cards-against

Juego de cartas multijugador online inspirado en "Cartas contra la humanidad"

Este es un fork que arregla muchos problemas de accesibilidad y que est� preparado para montar en un servidor propio y no en un netlify.

### como montar el proyecto
tenemos dos componentes:
* un front-end hecho react y styled-components (carpeta www)
* un back-end hecho con nodejs y socket.io (carpeta api)

en ambas carpetas es necesario instalar las dependencias `node_modules` (con `npm install`. Esto solo es necesario hacerlo una vez.

Hay que cambiar, en el archivo src/config, el api y el socket.

Adem�s si quieres usarlo en tu propio servidor hay que instalar Redis, eso en Ubuntu se hace con `apt install redis`.

Una vez hecho esto:

* para arrancar el backend con live-reload se usa el comando `npm run dev` en la carpeta `api`
* para arrancar el frontend con live-reload se usa el comando `npm start` en la carpeta `www`

#### Configurando el proxy

Yo lo tengo hecho con Caddy 2, os paso un ejemplo, pod�is adaptarlo a Nginx, Apache o lo que quer�is.

Con el Caddy nos olvidamos tambi�n del archivo de redirects, pero es necesario porque es una single Page Application con su propio ruteado y si no se va a liar.

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

Todas las contribuciones son bienvenidas, tanto en forma de feedback (issue) como en forma de c�digo (PR) siempre que se mantengan las reglas de estilo definidas via eslint

*Atención*: Para que el juego sea accesible, los espacios en blanco en las cartas negras se escribirán siempre con un símbolo de subrayado (_) igual que en las cartas base. Ejemplo: Fui al supermercado y compré una bolsa de patatas y _.
Esto hace que el juego reemplace correctamente los subrayados por (blanco) para tecnologías de asistencia como los lectores de pantalla.
