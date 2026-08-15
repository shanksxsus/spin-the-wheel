(function(){
  const screen  = document.getElementById('screen');
  const content = document.getElementById('content');
  const input   = document.getElementById('cmdInput');
  const form    = document.getElementById('inputForm');

  // ---- live uptime counter, ticking every second from the neofetch snapshot ----
  const startMs = Date.now();
  function fmtUptime(){
    const diffSec = Math.floor((Date.now() - startMs) / 1000);
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    return `${h} hour${h!==1?'s':''}, ${m} min${m!==1?'s':''}, ${String(s).padStart(2,'0')} secs`;
  }
  setInterval(()=>{
    // re-query each tick so this keeps working even after "clear" removes/rebuilds content
    const el = document.getElementById('uptimeVal');
    if(el) el.textContent = fmtUptime();
  }, 1000);

  const cmdLog = [];
  let cmdPos = -1;

  // ABOUT, SKILLS, PROJECTS, CONTACT, RESUME are loaded from data/*.js (see index.html)
  const FOLDERS = ['about.txt','skills.txt','projects/','contact.txt','resume.pdf'];

  const HELP_ROWS = [
    ['help',          'show this list of commands'],
    ['about',         'a little about me'],
    ['skills',        'tech stack &amp; tools'],
    ['projects',      'things I\'ve built'],
    ['contact',       'ways to reach me'],
    ['resume',        'open / download my resume'],
    ['whoami',        'print current user'],
    ['pwd',            'print working directory'],
    ['ls',             'list home directory'],
    ['uname -r',       'print kernel release'],
    ['neofetch',       'redraw the system banner'],
    ['clear',          'clear the screen'],
    ['sudo [cmd]',     'try it and see'],
  ];

  function el(tag, cls, html){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  function scrollDown(){
    screen.scrollTop = screen.scrollHeight;
  }

  function printPromptEcho(text){
    const line = el('div','prompt-line');
    line.innerHTML = `<span class="ps">thuperman@portfolio:~$</span><span class="cmd"></span>`;
    line.querySelector('.cmd').textContent = text;
    content.appendChild(line);
  }

  function printOutput(html, cls){
    const out = el('div', 'output' + (cls ? ' ' + cls : ''), html);
    content.appendChild(out);
  }

  function printFolders(items){
    const wrap = el('div','folders');
    items.forEach(name=>{
      const s = el('span','folder',name);
      wrap.appendChild(s);
    });
    content.appendChild(wrap);
  }

  function printTable(rows){
    const wrap = el('div','output');
    rows.forEach(([k,v])=>{
      const row = el('div', null, `<span class="accent">${k.padEnd(12,' ').replace(/ /g,'&nbsp;')}</span> ${v}`);
      wrap.appendChild(row);
    });
    content.appendChild(wrap);
  }

  function runCommand(raw){
    const cmd = raw.trim();
    printPromptEcho(raw);
    if(cmd.length){
      cmdLog.push(raw);
    }
    cmdPos = cmdLog.length;

    const lower = cmd.toLowerCase();

    if(lower === ''){
      // nothing to do
    } else if(lower === 'help' || lower === '?'){
      const wrap = el('div','output');
      wrap.appendChild(el('div', null, 'available commands:'));
      HELP_ROWS.forEach(([k,v])=>{
        wrap.appendChild(el('div', null, `&nbsp;&nbsp;<span class="accent">${k.padEnd(14,' ').replace(/ /g,'&nbsp;')}</span> <span class="muted">${v}</span>`));
      });
      content.appendChild(wrap);
    } else if(lower === 'whoami'){
      printOutput('thuperman &mdash; full-stack developer &amp; digital tinkerer');
    } else if(lower === 'pwd'){
      printOutput('/home/thuperman');
    } else if(lower === 'ls' || lower === 'ls -la' || lower === 'ls -l'){
      printFolders(FOLDERS);
    } else if(lower === 'uname -r'){
      printOutput('6.8.9-zen1-1-zen');
    } else if(lower === 'uname' || lower === 'uname -a'){
      printOutput('Linux portfolio 6.8.9-zen1-1-zen #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
    } else if(lower === 'about' || lower === 'cat about.txt'){
      printOutput(ABOUT.replace(/\n/g,'<br>'));
    } else if(lower === 'skills' || lower === 'cat skills.txt'){
      printTable(SKILLS);
    } else if(lower === 'projects' || lower === 'ls projects'){
      const wrap = el('div','output');
      PROJECTS.forEach(([name, desc, link])=>{
        wrap.appendChild(el('div', null,
          `<span class="folder">${name}</span> &mdash; ${desc}<br>&nbsp;&nbsp;<span class="link">${link}</span>`));
      });
      content.appendChild(wrap);
    } else if(lower === 'contact' || lower === 'cat contact.txt'){
      printTable(CONTACT);
    } else if(lower === 'resume' || lower === 'cat resume.pdf'){
      printOutput(`${RESUME.message} <a class="link" href="${RESUME.url}" target="_blank" rel="noopener">${RESUME.url}</a>`);
    } else if(lower === 'neofetch'){
      printOutput('redrawing banner above ↑ &mdash; scroll up to see it.');
      screen.scrollTop = 0;
    } else if(lower === 'clear' || lower === 'cls'){
      content.innerHTML = '';
    } else if(lower.startsWith('sudo')){
      printOutput(`[sudo] password for thuperman: <br>Nice try. Permission denied.`, 'err');
    } else if(lower.startsWith('echo ')){
      const text = cmd.slice(5);
      printOutput(text.replace(/</g,'&lt;'));
    } else if(lower === 'date'){
      printOutput(new Date().toString());
    } else if(lower === 'history'){
      const wrap = el('div','output');
      cmdLog.forEach((c,i)=> wrap.appendChild(el('div', null, `${i+1}  ${c}`)));
      content.appendChild(wrap);
    } else if(lower === 'exit'){
      printOutput('logout<br><span class="muted">(nice try &mdash; this terminal doesn\'t actually close)</span>');
    } else {
      printOutput(`command not found: ${cmd.split(' ')[0]}. type <span class="accent">help</span> to see what's available.`, 'err');
    }

    scrollDown();
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = input.value;
    input.value = '';
    runCommand(val);
    screen.appendChild(form);
    scrollDown();
    input.focus();
  });

  input.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowUp'){
      e.preventDefault();
      if(cmdLog.length === 0) return;
      cmdPos = Math.max(0, cmdPos - 1);
      input.value = cmdLog[cmdPos] || '';
    } else if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(cmdLog.length === 0) return;
      cmdPos = Math.min(cmdLog.length, cmdPos + 1);
      input.value = cmdLog[cmdPos] || '';
    } else if(e.key === 'Tab'){
      e.preventDefault();
      const partial = input.value.toLowerCase();
      const options = ['help','about','skills','projects','contact','resume','whoami','pwd','ls','uname -r','neofetch','clear','history'];
      const match = options.find(o => o.startsWith(partial));
      if(match) input.value = match;
    }
  });

  // clicking anywhere in the screen focuses the live input
  screen.addEventListener('click', ()=> input.focus());
  window.addEventListener('load', ()=> input.focus());
})();
