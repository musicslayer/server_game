export async function fetchImages() {
    console.log("HELLO!!!");

    let response = await fetch("http://localhost/images");
    let text = await response.text();
    //let image = await loadImage(text);
	
	//let blob = await response.blob();
	//const imageURL = URL.createObjectURL(blob);

    //console.log(objectURL);
    //console.log(text);

    return text;
    
    /*
    fetch("http://localhost/images")
    .then(response => response.json())
    .then(json => console.log(json));
    */
}