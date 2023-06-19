let start = new Date()

function measureLag() {
    setInterval(() => {
        let end = new Date();
        const lag = new Date() - start
        start = end;

        if(lag > 10) {
            console.log(`Loop took\t${lag} ms`)
        }
    }, 5)
}
measureLag()