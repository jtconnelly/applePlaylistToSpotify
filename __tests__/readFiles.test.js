const { readFiles } = require('../path/to/readFiles'); // Adjust the path as necessary

test('reads files correctly', () => {
    const result = readFiles('testFile.txt'); // Adjust the input as necessary
    expect(result).toBe('expected content'); // Adjust the expected output as necessary
});