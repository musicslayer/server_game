const fs = require('fs');

function addNextTickRecurs(count) {
    let self = this;
    if (self.id === undefined) {
        self.id = 0;
    }

    if (self.id === count) return;

    process.nextTick(() => {
        console.log(`process.nextTick call ${++self.id}`);
        addNextTickRecurs.call(self, count);
    });
}

addNextTickRecurs(1000);
setTimeout(console.log.bind(console, 'omg! setTimeout was called'), 10);
setImmediate(console.log.bind(console, 'omg! setImmediate also was called'));
fs.readFile(__filename, () => {
    console.log('omg! file read complete callback was called!');
});

console.log('started');