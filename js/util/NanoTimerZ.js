const UNIT_FACTORS = {"s": 1000000000, "m": 1000000, "u": 1000, "n": 1};

class NanoTimerZ {
	flag;
	T;
	R;

	intervalTime;
	hrtimeDelta;

	date1;

	COUNT = 0;

	setInterval(task, interval) {
		this.flag = true;

		this.intervalTime = Number(interval.slice(0, interval.length - 1)) * UNIT_FACTORS[interval[interval.length-1]];
		this.hrtimeDelta = 0;

		if(this.intervalTime === 0) {
			// Use a specialized function to run as fast as possible.
			this.doSetIntervalZero(task);
		}
		else {
			this.T = process.hrtime();
			this.doSetInterval(task);
		}
	}

	doSetIntervalZero(task) {
		// Keep executing the task until the interval is cleared.
		task();

		if(this.flag) {
			this.R = setImmediate(() => {
				this.doSetIntervalZero(task);
			});
		}
	}

	doSetInterval(task) {
		let DD = (Date.now() - this.date1);
		if(DD > 2) {
			console.log("HRD " + (Date.now() - this.date1));
		}
		this.date1 = Date.now();

		// Check if it's time to run the task yet.
		if(this.hrtimeDelta < this.intervalTime) {
			let hrtimeDeltaArray = process.hrtime(this.T);

			this.hrtimeDelta = (hrtimeDeltaArray[0] * 1000000000) + hrtimeDeltaArray[1];
		}
		else {
			this.hrtimeDelta -= this.intervalTime;
			this.T = process.hrtime();
			
			task();
		}

		// Keep going unless the task cleared the interval.
		if(this.flag) {
			//this.R = setImmediate(() => {
			//	this.doSetInterval(task);
			//});

			//this.R2 = setTimeout(() => {
			//	this.doSetInterval(task);
			//});

			process.nextTick(() => {
				this.doSetInterval(task);
			});
		}
	}

	clearInterval() {
		clearImmediate(this.R);

		this.flag = undefined;
		this.T = undefined;
		this.R = undefined;
	}
}

module.exports = NanoTimerZ;