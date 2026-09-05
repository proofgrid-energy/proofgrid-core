// SPDX-License-Identifier: MPL-2.0
// Framing for the installed VS Code JSON language server; never launches a process.
export function encode(message) {
  const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }));
  return Buffer.concat([Buffer.from('Content-Length: ' + body.length + '\r\n\r\n'), body]);
}

export function decode(buffer) {
  const messages = [];
  while (buffer.length) {
    const boundary = buffer.indexOf('\r\n\r\n');
    if (boundary < 0) throw new Error('Incomplete language-server response header');
    const match = /Content-Length: (\d+)/i.exec(buffer.subarray(0, boundary).toString());
    if (!match) throw new Error('Invalid language-server response header');
    const end = boundary + 4 + Number(match[1]);
    if (buffer.length < end) throw new Error('Incomplete language-server response body');
    messages.push(JSON.parse(buffer.subarray(boundary + 4, end)));
    buffer = buffer.subarray(end);
  }
  return messages;
}
