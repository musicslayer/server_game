function measureLag(iteration) {
    const start = new Date()

    setImmediate(() => {
        const lag = new Date() - start

        if(lag > 20) {
            console.log(`Loop ${iteration} took\t${lag} ms`)
        }

        measureLag(iteration + 1) // Recurse
    })
}
measureLag(1)