export function readMatrixFromBuffer(data: ArrayBuffer) {
	let off = 0;
	const numDims = new Int32Array(data, off, 1)[0];
	off += 4;

	const dims = new Int32Array(data, off, numDims);
	off += numDims * 4;

	let vals: any = new Float32Array(data, off);

	// Construct the matrix from inner-most dimension outwards
	for (let i = dims.length - 1; i > 0; i--) {
		const dim = dims[i];
		const newVals = [];
		for (let j = 0; j < dims[i - 1]; j++) {
			newVals.push(Array.from(vals.slice(j * dim, (j + 1) * dim)));
		}
		vals = newVals;
	}

	return vals;
}
