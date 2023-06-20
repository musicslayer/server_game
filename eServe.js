fetch("http://localhost/")
  .then((response) => response.json())
  .then((json) => console.log(json));