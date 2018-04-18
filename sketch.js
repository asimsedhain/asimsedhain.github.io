function setup() {
  noLoop();
  loadJSON("https://api.github.com/users/asimsedhain/repos", cBack);

}

function cBack(data){
  for(let i=0; i<data.length;i++){
    createA(`https://asimsedhain.github.io/${data[i].name}/`, `${data[i].name}`);
  }
  
}

