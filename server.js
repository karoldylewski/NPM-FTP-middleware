const MISSING_HEADER = 'Invalid request header parameters';
const MISSING_BODY = 'Invalid body. Should contain filename, path, body';
const FILE_UPLAOD_OK = 'File uploaded successfully!'
const FILE_UPLOAD_FAIL = 'Error while uploading file to FTP'
const FAILED_OPERATION = 'Failed';
const SUCCESS_OPERATION = 'Success';
const http = require('http')
const jsftp = require("jsftp");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const server = http.createServer(function(request, response) {
  if (request.method == 'POST') {
    var body = ''
    request.on('data', function(data) {
      body += data
    })
    request.on('end', function() {
      if (isParameterInvalid(request.headers)){
        response.writeHead(400, {'Content-Type': 'text/html'})
        response.end(createResponsObject(FAILED_OPERATION,MISSING_HEADER,400))
      }
      if (isBodyInvalid(body)){
        response.writeHead(400, {'Content-Type': 'text/html'})
        response.end(createResponsObject(FAILED_OPERATION,MISSING_BODY,400))
      }
      let ftpConfig = readParameters(request.headers)
      let parsedRequestFullBody = JSON.parse(body)
      
      putFileOnFtp(ftpConfig,parsedRequestFullBody,response);
    })
  }  else {
    response.writeHead(404, {'Content-Type': 'text/html'})
    response.end('Unknown request method')
  }
})

const port = 3000
const host = '127.0.0.1'
server.listen(port, host)
console.log(`Listening at http://${host}:${port}`)

function putFileOnFtp(ftpConfig, parsedRequestFullBody,response){
  let Ftp = new jsftp({
    host: ftpConfig.host,
    port: 21, 
    user: ftpConfig.username,
    pass: ftpConfig.password
  });
  let valueToSent = parsedRequestFullBody.body;
  var buffer = new Buffer(valueToSent, "binary");

  Ftp.put(buffer, parsedRequestFullBody.path+parsedRequestFullBody.filename, err => {
    if (!err) {
      response.writeHead(200, {'Content-Type': 'text/html'})
      response.end(createResponsObject(SUCCESS_OPERATION,FILE_UPLAOD_OK,200))
    }else{
      console.log(JSON.stringify(err))
      response.writeHead(400, {'Content-Type': 'text/html'})
      response.end(createResponsObject(FAILED_OPERATION,FILE_UPLOAD_FAIL,400))
    }
  });
}

function isParameterInvalid(headers){
    if (headers.username && headers.password && headers.ftphost &&  headers.port && headers.ftptype){
      return false;
    }
    return true;
}

function isBodyInvalid(body){
  var post = JSON.parse(body)
  if (post.filename && post.path && post.body){
    return false;
  }
  return true;
}

function readParameters(headers){
  var ftpConfig = {
    username: headers.username,
    password: headers.password,
    host: headers.ftphost,
    port: headers.port,
    type: headers.ftptype
  };
  return ftpConfig;
}

function createResponsObject(opStatus,opMessage,opCode){
  var responseObject = {
    Status: opStatus,
    Message: opMessage,
    Code: opCode
  };
  return JSON.stringify(responseObject);
}
