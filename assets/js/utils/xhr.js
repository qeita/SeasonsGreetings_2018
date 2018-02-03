let xhr = (params) => {
  let req = new XMLHttpRequest();

  req.onreadystatechange = () => {
    if(req.readyState === 4){
      if(req.status === 200){
        // JSONファイルの場合パース処理追加
        if(params.url.indexOf('.json') > 0){
          params.callback(JSON.parse(req.responseText));
        }
      }
    }
  };

  req.open(params.type, params.url, true);
  if(params.url.indexOf('.json') > 0){
    req.setRequestHeader('Content-Type', 'application/json')
  }

  req.send(null);
};