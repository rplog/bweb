const input = document.getElementById('input');
const output = document.getElementById('output');
const cursor = document.querySelector('.cursor');
const terminal = document.querySelector('.terminal');

const welcomeMessage = `Welcome to Neosphere!
Type 'help' to see a list of available commands.`;

output.innerHTML = `<div>${welcomeMessage}</div>`;

const commands = {
    whoami: 'Neo',
    ls: '<a href="gallery.html">gallery</a> <a href="about.html">about</a> <a href="contact.html">contact</a>',
    help: 'Available commands: whoami, ls, help, clear, date, ping, sudo, matrix, weather, joke, cd',
    date: () => new Date().toString(),
    ping: 'pong',
    sudo: 'User not in the sudoers file. This incident will be reported.',
    matrix: 'The Matrix has you, Neo.',
    weather: 'It is currently raining code.',
    joke: 'Why do programmers prefer dark mode? Because light attracts bugs.',
    '': ''
};

function clearTerminal() {
    output.innerHTML = '';
}

function handleCd(arg) {
    if (arg === 'gallery' || arg === 'about' || arg === 'contact') {
        window.location.href = `${arg}.html`;
        return `Navigating to ${arg}...`;
    }
    return `cd: no such file or directory: ${arg}`;
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const fullCommand = input.value.trim().toLowerCase();
        const [command, arg] = fullCommand.split(' ');
        
        output.innerHTML += `<div class="prompt-container"><span class="prompt">neo@neosphere:~$</span><span>${input.value}</span></div>`;

        if (command === 'clear') {
            clearTerminal();
        } else if (command === 'cd') {
            const response = handleCd(arg);
            output.innerHTML += `<div>${response}</div>`;
        } else {
            const response = commands[command];
            if (response) {
                if (typeof response === 'function') {
                    output.innerHTML += `<div>${response()}</div>`;
                } else {
                    output.innerHTML += `<div>${response}</div>`;
                }
            } else if (command !== '') {
                output.innerHTML += `<div>${command}: command not found</div>`;
            }
        }

        input.value = '';
        output.scrollTop = output.scrollHeight;
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        document.title = 'Here Am I';
    } else {
        document.title = 'Neosphere';
    }
});

terminal.addEventListener('click', () => {
    input.focus();
});

setInterval(() => {
    cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
}, 500);

