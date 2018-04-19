function setup() {
  noLoop();
  loadJSON("https://api.github.com/users/asimsedhain/repos", cBack);

}

function cBack(data){
  for(let i=0; i<data.length;i++){
    if(data[i].name=="asimsedhain.github.io" || data[i].has_pages === false){
      continue;
    }else{
      let a = createDiv(data[i].name);
      a.mouseClicked(() => {
        a.style("background", "black");
        window.location = `https://asimsedhain.github.io/${data[i].name}`;
      });
    }
  }
  
}

