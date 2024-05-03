
Something

```shell
$ docker run -d -p 9090:8080 plantuml/plantuml-server:jetty
$ cd packages/dump
$ npm run build
$ node . > blah.txt
$ curl -s --data-binary @blah.txt http://localhost:9090/svg -o test.svg  
```