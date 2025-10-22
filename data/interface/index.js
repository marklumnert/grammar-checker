var config  = {
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "cancel": {
    "drop": function (e) {
      if (e.target.id === "choose") return;
      e.preventDefault();
    }
  },
  "scroll": {
    "id": null,
    "to": {
      "top": function (e) {
        const _step = function () {
          const c = e.scrollTop;
          const threshold = Math.floor(Math.max(5, c / 8));
          if (c > threshold) {
            e.scrollTop = c - c / 8;
            config.scroll.id = requestAnimationFrame(_step);
          } else {
            e.scrollTop = 0;
            cancelAnimationFrame(config.scroll.id);
          }
        }
        _step();
      }
    }
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          let current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      let context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.documentElement.style.width = "780px";
              document.documentElement.style.height = "550px";
            }
            /*  */
            chrome.runtime.connect({"name": config.port.name});
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          let tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp);
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id);
        }
      }
    }
  },
  "load": function () {
    const dark = document.getElementById("dark");
    const copy = document.getElementById("copy");
    const start = document.getElementById("start");
    const clear = document.getElementById("clear");
    const accept = document.getElementById("accept");
    const reload = document.getElementById("reload");
    const support = document.getElementById("support");
    const donation = document.getElementById("donation");
    const userarea = document.getElementById("userarea");
    const userinput = document.getElementById("userinput");
    /*  */
    userarea.addEventListener("scroll", function () {
      userinput.scrollTop = userarea.scrollTop;
    });
    /*  */
    userinput.addEventListener("scroll", function () {
      userarea.scrollTop = userinput.scrollTop;
    });
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    }, false);
    /*  */
    start.addEventListener("click", async function () {
      await config.app.listener.input({"target": userarea});
    }, false);
    /*  */
    support.addEventListener("click", function () {
      const url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      const url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    copy.addEventListener("click", function () {
      navigator.clipboard.writeText(userarea.value).then(() => {
        userarea.select();
      });
    });
    /*  */
    dark.addEventListener("click", function () {
      let mode = document.documentElement.getAttribute("mode");
      /*  */
      mode = mode === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("mode", mode);
      config.storage.write("mode", mode);
    });
    /*  */
    clear.addEventListener("click", async function () {
      const action = window.confirm("Do you want to clear the interface? All text will be lost.");
      if (action) {
        userarea.value = '';
        userinput.textContent = '';
        await config.app.listener.input({"target": userarea});
        /*  */
        document.location.reload();
      }
    }, false);
    /*  */
    userarea.addEventListener("drop", function (e) {
      if (e.dataTransfer) {
        e.preventDefault();
        /*  */
        const file = e.dataTransfer.files[0];
        if (file && file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = async function (e) {
            if (e.target.result) {
              userarea.value = e.target.result;
              await new Promise(resolve => window.setTimeout(resolve, 300));
              await config.app.listener.input({"target": userarea});
            }
          };
          /*  */
          reader.readAsText(file);
        } else {
          window.alert("Please drop a valid .txt file and try again!");
        }
      }
    });
    /*  */
    accept.addEventListener("click", async function () {
      const flag = window.confirm("Do you want to accept all suggestions?");
      if (flag) {
        const user = document.querySelector("#userinput");
        const suggestions = document.querySelector(".suggestions .suggestion-box");
        const count = [...suggestions.querySelectorAll("[replacement]")].length;
        /*  */
        config.scroll.to.top(user);
        await new Promise(resolve => window.setTimeout(resolve, 300));
        /*  */
        for (let i = 0; i < count; i++) {
          const replacement = suggestions.querySelector("[replacement]");
          if (replacement) {
            replacement.click();
            await new Promise(resolve => window.setTimeout(resolve, 300));
            /*  */
            const selected = user.querySelector(".highlight.selected");
            if (selected) {
              selected.scrollIntoView({"block": "center"});
            }
            /*  */
            if (replacement.querySelector(".manual")) {
              await config.app.listener.button.dismiss({
                "isTrusted": false,
                "target": replacement.querySelector(".actions .dismiss")
              });
            } else {
              await config.app.listener.button.accept({
                "isTrusted": false,
                "target": replacement.querySelector(".actions .accept")
              });
            }
          }
        }
        /*  */
        config.scroll.to.top(user);
      }
    });
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "worker": null,
    "current": {
      "source": '',
      "dismiss": []
    },
    "start": async function () {
      const suggestions = document.querySelector(".suggestions .suggestion-box");
      const userarea = document.getElementById("userarea");
      const usertext = config.storage.read("usertext");
      const loader = suggestions.querySelector("svg");
      const mode = config.storage.read("mode");
      const harper = "./vendor/harper.js";
      /*  */
      config.app.current.dismiss = [];
      if (loader) loader.style.display = "block";
      if (usertext !== undefined) userarea.value = usertext;
      document.documentElement.setAttribute("mode", mode !== undefined ? mode : "light");
      /*  */
      const module = await import(harper);
      const options = {"binary": module.binaryInlined};
      config.app.worker = new module.WorkerLinter(options);
      await config.app.listener.input({"target": userarea});
      await new Promise(resolve => window.setTimeout(resolve, 300));
      /*  */
      if (loader) loader.style.display = "none";
      /*  */
      userarea.addEventListener("input", function (e) {
        const a = e.inputType && e.inputType === "insertLineBreak";
        const b = e.inputType && e.inputType === "deleteContentForward";
        const c = e.inputType && e.inputType === "deleteContentBackward";
        /*  */
        const timeout = a || b || c ? 0 : 1000;
        if (config.app.listener.timeout) window.clearTimeout(config.app.listener.timeout);
        config.app.listener.timeout = window.setTimeout(async function () {
          await config.app.listener.input(e);
        }, timeout);
      });
    },
    "listener": {
      "timeout": null,
      "highlight": function (e) {
        if (e.target) {
          const suggestions = {};
          const startend = e.target.getAttribute("startend");
          /*  */
          suggestions.targets = {};
          suggestions.user = document.querySelector("#userinput");
          suggestions.box = document.querySelector(".suggestions .suggestion-box");
          suggestions.targets.box = [...suggestions.box.querySelectorAll("[startend]")];
          suggestions.targets.userinput = [...suggestions.user.querySelectorAll("[startend]")];
          suggestions.buttons = [...suggestions.box.querySelectorAll("[startend='" + startend + "']")];
          suggestions.highlights = [...suggestions.user.querySelectorAll("[startend='" + startend + "']")];
          /*  */
          suggestions.targets.box.forEach(function (e) {e.className = ''});
          suggestions.targets.userinput.forEach(function (e) {e.className = "highlight"});
          suggestions.highlights.forEach(function (e) {e.className = "highlight selected"});
          suggestions.buttons.forEach(function (e) {
            e.className = "suggestion-button";
            e.scrollIntoView({
              "block": "nearest",
              "behavior": "smooth"
            });
          });
        }
      },
      "input": async function (e) {
        if (e.target) {
          const suggestions = document.querySelector(".suggestions .suggestion-box");
          const userinput = document.getElementById("userinput");
          const loader = suggestions.querySelector("svg");
          /*  */
          config.storage.write("usertext", e.target.value);
          /*  */
          if (e.target.value) {
            try {
              const error = document.querySelector(".container .footer .error");
              /*  */
              if (loader) loader.style.display = "block";
              userinput.textContent = e.target.value;
              config.app.current.source = userinput.textContent;
              /*  */
              const cursor = e.target.selectionStart;
              const lints = await config.app.worker.lint(config.app.current.source);
              /*  */
              error.textContent = '';
              suggestions.textContent = '';
              if (loader) loader.style.display = "none";
              /*  */
              for (let lint of lints) {
                config.app.methods.highlight(lint);
              }
              /*  */
              e.target.focus();
              e.target.setSelectionRange(cursor, cursor);
            } catch (e) {
              if (loader) loader.style.display = "none";
              if (e && e.message) window.alert(e.message);
            }
          }
        }
      },
      "button": {
        "dismiss": async function (e) {
          if (e.target) {
            const target = e.target.closest("div[replacement]");
            /*  */
            if (target) {
              const classname = target.className;
              const startend = target.getAttribute("startend");
              const userarea = document.getElementById("userarea");
              /*  */
              if (classname === "suggestion-button") {      
                target.remove();
                config.app.current.dismiss.push(startend);
                await config.app.listener.input({"target": userarea});
                await new Promise(resolve => window.setTimeout(resolve, 300));
              }
            }
          }
        },
        "accept": async function (e) {
          if (e.target) {
            const target = e.target.closest("div[replacement]");
            /*  */
            if (target) {
              const classname = target.className;
              const startend = target.getAttribute("startend");
              const userarea = document.getElementById("userarea");
              const userinput = document.getElementById("userinput");
              const replacement = target.getAttribute("replacement");
              /*  */
              if (e.isTrusted === false || classname === "suggestion-button") {
                const end = startend.split(':')[1];
                const start = startend.split(':')[0];          
                const source = config.app.current.source;
                const newtext = source.substring(0, start) + replacement + source.substring(end);
                /*  */
                target.remove();
                userarea.value = newtext;
                userinput.textContent = newtext;
                config.app.current.source = newtext;
                await config.app.listener.input({"target": userarea});
                await new Promise(resolve => window.setTimeout(resolve, 300));
              }
            }
          }
        }
      }
    },
    "methods": {
      "color": function (priority) {
        let red = 255;
        priority = Math.max(0, Math.min(priority, 150));
        if (priority <= 100) {
          red = Math.floor(255 - (priority / 100) * 55);
        } else {
          red = Math.floor(200 - ((priority - 100) / 50) * 100);
        }
        /*  */
        return `rgb(${red}, 0, 0)`;
      },
      "insert": {
        "span": function (start, end, span) {
          const metrics = {};
          const range = document.createRange();
          const selection = window.getSelection();
          const userinput = document.getElementById("userinput");
          /*  */
          metrics.end = {};
          metrics.start = {};
          metrics.current = {};
          /*  */
          metrics.end.offset = 0;
          metrics.end.node = null;
          metrics.start.offset = 0;
          metrics.start.node = null;
          metrics.current.offset = 0;
          /*  */
          metrics.find = function (node) {
            if (node.nodeType === Node.TEXT_NODE) {
              const length = node.textContent.length;
              /*  */
              if (metrics.current.offset <= start && start < metrics.current.offset + length) {
                metrics.start.node = node;
                metrics.start.offset = start - metrics.current.offset;
              }
              /*  */
              if (metrics.current.offset <= end && end <= metrics.current.offset + length) {
                metrics.end.node = node;
                metrics.end.offset = end - metrics.current.offset;
              }
              /*  */
              metrics.current.offset += length;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              for (const child of node.childNodes) {
                metrics.find(child);
              }
            }
          }
          /*  */
          metrics.find(userinput);
          /*  */
          if (metrics.start.node && metrics.end.node) {
            range.setStart(metrics.start.node, metrics.start.offset);
            range.setEnd(metrics.end.node, metrics.end.offset);
            range.deleteContents();
            range.insertNode(span);
            /*  */
            selection.removeAllRanges();
            selection.addRange(range);
            range.collapse(false);
          }
        }
      },
      "highlight": function (lint) {
        try {
          const current = {};
          const highlight = {};
          const message = lint.message();
          const problem = lint.get_problem_text();
          const object = JSON.parse(lint.to_json());
          const suggestions = document.querySelector(".suggestions .suggestion-box");
          /*  */
          current.index = {};
          current.problem = problem;
          current.inner = object.inner;
          current.priority = current.inner.priority;
          current.index.end = current.inner.span.end;
          current.index.start = current.inner.span.start;
          current.startend = current.index.start + ':' + current.index.end;
          current.target = config.app.current.source.substring(current.index.start, current.index.end);
          /*  */
          if (config.app.current.dismiss.indexOf(current.startend) === -1) {
            highlight.target = current.problem ? current.problem : current.target;
            highlight.node = document.createTextNode(highlight.target);
            highlight.suggestions = current.inner.suggestions.length ? current.inner.suggestions : [{"ReplaceWith": [current.problem]}];
            highlight.span = document.createElement("span");
            /*  */
            highlight.span.className = "highlight";
            highlight.span.appendChild(highlight.node);
            highlight.span.setAttribute("startend", current.startend);
            highlight.span.addEventListener("click", config.app.listener.highlight);
            highlight.span.style.borderColor = config.app.methods.color(current.inner.priority);
            config.app.methods.insert.span(current.index.start, current.index.end, highlight.span);
            /*  */
            for (let i = 0; i < highlight.suggestions.length; i++) {
              const alternatives = highlight.suggestions[i].ReplaceWith;
              const replacement = alternatives.join('');
              const kind = current.inner.lint_kind;
              /*  */
              const title = document.createElement("div");
              const button = document.createElement("div");
              const reason = document.createElement("div");
              const accept = document.createElement("div");
              const actions = document.createElement("div");
              const dismiss = document.createElement("div");
              /*  */
              button.title = message;
              title.className = "title";
              reason.className = "reason";
              accept.className = current.inner.suggestions.length ? "accept" : "accept manual";
              reason.textContent = current.inner.suggestions.length ? message : message + " Please review and correct manually."
              accept.textContent = "Accept";
              actions.className = "actions";
              dismiss.className = "dismiss";
              dismiss.textContent = "Dismiss";
              title.textContent = kind + " - " + replacement;
              button.setAttribute("replacement", replacement);
              button.setAttribute("startend", current.startend);
              button.addEventListener("click", config.app.listener.highlight);
              accept.addEventListener("click", config.app.listener.button.accept);
              dismiss.addEventListener("click", config.app.listener.button.dismiss);
              /*  */
              button.appendChild(title);
              button.appendChild(reason);
              actions.appendChild(accept);
              actions.appendChild(dismiss);
              button.appendChild(actions);
              suggestions.appendChild(button);
            }
            /*  */
            const item = document.createElement("li");
            const error = document.querySelector(".container .footer .error");
            const text = document.createTextNode(message);
            item.appendChild(text);
            error.appendChild(item);
          }
        } catch (e) {
          if (e && e.message) window.alert(e.message);
        }
      }
    }
  }
};

config.port.connect();

document.addEventListener("drop", config.cancel.drop, true);
document.addEventListener("dragover", config.cancel.drop, true);

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
