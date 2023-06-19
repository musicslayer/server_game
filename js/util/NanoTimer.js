const UNIT_FACTORS = {"s": 1000000000, "m": 1000000, "u": 1000, "n": 1};

class NanoTimer {
	flag;
	T;
	R;

	setInterval(task, interval) {
		this.flag = true;

		let intervalTime = Number(interval.slice(0, interval.length - 1)) * UNIT_FACTORS[interval[interval.length-1]];

		if(intervalTime === 0) {
			// Use a specialized function to run as fast as possible.
			this.doSetIntervalZero(task);
		}
		else {
			this.T = process.hrtime();
			this.doSetInterval(task, intervalTime, 0);
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

	doSetInterval(task, intervalTime, hrtimeDelta) {
		// Check if it's time to run the task yet.
		if(hrtimeDelta < intervalTime) {
			let hrtimeDeltaArray = process.hrtime(this.T);
			hrtimeDelta = (hrtimeDeltaArray[0] * 1000000000) + hrtimeDeltaArray[1];
		}
		else {
			hrtimeDelta -= intervalTime;
			this.T = process.hrtime();
			task();	
		}

		// Keep going unless the task cleared the interval.
		if(this.flag) {
			this.R = setImmediate(() => {
				this.doSetInterval(task, intervalTime, hrtimeDelta);
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

module.exports = NanoTimer;