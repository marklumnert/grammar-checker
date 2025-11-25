var config  = {
  "elements": {},
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
              document.documentElement.style.width = "790px";
              document.documentElement.style.height = "590px";
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
    config.elements.root = document.documentElement;
    config.elements.dark = document.getElementById("dark");
    config.elements.copy = document.getElementById("copy");
    config.elements.start = document.getElementById("start");
    config.elements.clear = document.getElementById("clear");
    config.elements.accept = document.getElementById("accept");
    config.elements.reload = document.getElementById("reload");
    config.elements.support = document.getElementById("support");
    config.elements.builtin = document.getElementById("builtin");
    config.elements.download = document.getElementById("download");
    config.elements.donation = document.getElementById("donation");
    config.elements.userarea = document.getElementById("userarea");
    config.elements.userinput = document.getElementById("userinput");
    config.elements.logs = document.querySelector(".container .footer .logs");
    config.elements.loader = document.querySelector(".suggestions .suggestion-box svg");
    config.elements.suggestions = document.querySelector(".suggestions .suggestion-box");
    /*  */
    config.elements.download.addEventListener("click", async function () {
      await config.app.methods.download.training.data();
    });
    /*  */
    config.elements.userarea.addEventListener("scroll", function () {
      config.elements.userinput.scrollTop = config.elements.userarea.scrollTop;
    });
    /*  */
    config.elements.userinput.addEventListener("scroll", function () {
      config.elements.userarea.scrollTop = config.elements.userinput.scrollTop;
    });
    /*  */
    config.elements.reload.addEventListener("click", function () {
      document.location.reload();
    }, false);
    /*  */
    config.elements.start.addEventListener("click", async function () {
      await config.app.listener.input({"target": config.elements.userarea}, true);
    }, false);
    /*  */
    config.elements.support.addEventListener("click", function () {
      const url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.elements.donation.addEventListener("click", function () {
      const url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.elements.copy.addEventListener("click", function () {
      navigator.clipboard.writeText(config.elements.userarea.value).then(() => {
        config.elements.userarea.select();
      });
    });
    /*  */
    config.elements.dark.addEventListener("click", function () {
      let mode = document.documentElement.getAttribute("mode");
      /*  */
      mode = mode === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("mode", mode);
      config.storage.write("mode", mode);
    });
    /*  */
    config.elements.clear.addEventListener("click", async function () {
      const action = window.confirm("Do you want to clear the interface? All text will be lost.");
      if (action) {
        config.elements.userarea.value = '';
        config.elements.userinput.textContent = '';
        await config.app.listener.input({"target": config.elements.userarea}, true);
        /*  */
        document.location.reload();
      }
    }, false);
    /*  */
    config.elements.builtin.addEventListener("change", async function (e) {
      config.storage.write("builtin", e.target.checked);
      /*  */
      const cond_1 = window.Proofreader;
      const cond_2 = e.target && e.target.checked;
      const cond_3 = navigator.userActivation.isActive;
      /*  */
      if (cond_1 && cond_2 && cond_3) {
        await config.app.methods.download.training.data();
      } else {
        await config.app.methods.wait(300);
        document.location.reload();
      }
    });
    /*  */
    config.elements.userarea.addEventListener("drop", function (e) {
      if (e.dataTransfer) {
        e.preventDefault();
        /*  */
        const file = e.dataTransfer.files[0];
        if (file && file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = async function (e) {
            if (e.target.result) {
              config.elements.userarea.value = e.target.result;
              await config.app.methods.wait(300);
              await config.app.listener.input({"target": config.elements.userarea}, true);
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
    config.elements.accept.addEventListener("click", async function () {
      const flag = window.confirm("Do you want to accept all suggestions?");
      if (flag) {
        const count = [...config.elements.suggestions.querySelectorAll("[replacement]")].length;
        /*  */
        config.scroll.to.top(config.elements.userinput);
        await config.app.methods.wait(300);
        /*  */
        for (let i = 0; i < count; i++) {
          const replacement = config.elements.suggestions.querySelector("[replacement]");
          if (replacement) {
            replacement.click();
            await config.app.methods.wait(300);
            /*  */
            const selected = config.elements.userinput.querySelector(".highlight.selected");
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
        config.scroll.to.top(config.elements.userinput);
      }
    });
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "highlights": [],
    "proofreader": null,
    "workerlinter": null,
    "current": {
      "source": '',
      "dismiss": []
    },
    "options": {
      "includeCorrectionTypes": true,
      "expectedInputLanguages": ["en"],
      "correctionExplanationLanguage": "en",
      "includeCorrectionExplanations": true
    },
    "start": async function () {
      const text = [];
      const mode = config.storage.read("mode");
      const item = document.createElement("li");
      const builtin = config.storage.read("builtin");
      const usertext = config.storage.read("usertext");
      /*  */
      config.app.highlights = [];
      config.app.proofreader = null;
      config.app.workerlinter = null;
      config.app.current.source = '';
      config.app.current.dismiss = [];
      config.elements.logs.appendChild(item);
      config.elements.builtin.checked = builtin;
      if (usertext !== undefined) config.elements.userarea.value = usertext;
      if (config.elements.loader) config.elements.loader.style.display = "block";
      config.elements.root.setAttribute("mode", mode !== undefined ? mode : "light");
      /*  */
      const module = await import(chrome.runtime.getURL("data/interface/vendor/harper.js"));
      config.app.workerlinter = new module.WorkerLinter({"binary": module.binaryInlined});
      item.textContent = "Harper.js is ready!";
      /*  */
      if (builtin) {
        if (window.Proofreader) {
          const availability = await window.Proofreader.availability();
          /*  */
          if (availability === "downloadable") {
            if (navigator.userActivation.isActive) {
              config.app.methods.download.training.data();
            } else {
              text.push("The built-in Gemini Nano AI needs to download training data for the first time.");
              text.push("Please mark the Gemini AI checkbox in the top-right toolbar to start downloading the training data.");
              await config.app.methods.error.builtin(item, text);
            }
          } else if (availability === "available") {
            config.app.proofreader = await window.Proofreader.create(config.app.options);
            /*  */
            item.textContent = "Gemini Nano AI is ready!";
          } else {
            text.push("The built-in Gemini Nano AI is not yet supported in this browser!");
            text.push("Please use only Harper.js for grammar check.");
            await config.app.methods.error.builtin(item, text);
          }
        } else {
          text.push("The built-in Gemini Nano AI is not activated in your browser.");
          text.push("Please Set the following flags to Enabled:\n");
          text.push("chrome://flags/#proofreader-api-for-gemini-nano");
          text.push("chrome://flags/#optimization-guide-on-device-model");
          text.push("chrome://flags/#prompt-api-for-gemini-nano-multimodal-input");
          text.push("\nThen, mark the Gemini AI checkbox in the top-right toolbar again to start downloading the training data.");
          await config.app.methods.error.builtin(item, text);
        }
      }
      /*  */
      await config.app.methods.wait(300);
      item.textContent = "Grammar Checker is ready!";
      /*  */
      await config.app.listener.input({"target": config.elements.userarea}, true);
      await config.app.methods.wait(300);
      /*  */
      if (config.elements.loader) config.elements.loader.style.display = "none";
      /*  */
      config.elements.userarea.addEventListener("input", function (e) {
        const a = e.inputType && e.inputType === "insertLineBreak";
        const b = e.inputType && e.inputType === "deleteContentForward";
        const c = e.inputType && e.inputType === "deleteContentBackward";
        /*  */
        const timeout = a || b || c ? 0 : 1000;
        if (config.app.listener.timeout) window.clearTimeout(config.app.listener.timeout);
        config.app.listener.timeout = window.setTimeout(async function () {
          await config.app.listener.input(e, true);
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
          suggestions.user = config.elements.userinput;
          suggestions.box = config.elements.suggestions;
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
      "button": {
        "dismiss": async function (e) {
          if (e.target) {
            const target = e.target.closest("div[replacement]");
            /*  */
            if (target) {
              const classname = target.className;
              const startend = target.getAttribute("startend");
              /*  */
              if (classname === "suggestion-button") {      
                target.remove();
                config.app.current.dismiss.push(startend);
                await config.app.listener.input({"target": config.elements.userarea}, false);
                await config.app.methods.wait(300);
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
              const problem = target.getAttribute("problem");
              const startend = target.getAttribute("startend");
              const replacement = target.getAttribute("replacement");
              /*  */
              if (e.isTrusted === false || classname === "suggestion-button") {
                const source = config.app.current.source;
                const end = Number(startend.split(':')[1]);
                const start = Number(startend.split(':')[0]);          
                const newtext = source.substring(0, start) + replacement + source.substring(end);
                /*  */
                target.remove();
                config.app.current.source = newtext;
                config.elements.userarea.value = newtext;
                config.elements.userinput.textContent = newtext;
                config.app.highlights = config.app.highlights.filter(e => e.problem !== problem);
                /*  */
                for (let i = 0; i < config.app.highlights.length; i++) {
                  const highlight = config.app.highlights[i];
                  const cond_1 = highlight.json.inner.span.end > end;
                  const cond_2 = highlight.json.inner.span.start > start;
                  /*  */
                  if (cond_1 && cond_2) {
                    highlight.json.inner.span.end += (replacement.length - problem.length);
                    highlight.json.inner.span.start += (replacement.length - problem.length);
                    config.app.highlights[i] = highlight;
                  }
                }
                /*  */
                await config.app.listener.input({"target": config.elements.userarea}, false);
                await config.app.methods.wait(300);
              }
            }
          }
        }
      },
      "input": async function (e, action) {
        if (e.target) {
          config.storage.write("usertext", e.target.value);
          /*  */
          if (e.target.value) {
            try {
              const cursor = e.target.selectionStart;
              const item = document.createElement("li");
              /*  */
              config.elements.logs.textContent = '';
              config.elements.logs.appendChild(item);
              config.elements.userinput.textContent = e.target.value;
              config.app.current.source = config.elements.userinput.textContent;
              if (config.elements.loader) config.elements.loader.style.display = "block";
              /*  */
              if (action) {
                config.app.highlights = [];
                /*  */
                if (config.app.workerlinter) {
                  item.textContent = "Checking grammar with Harper.js, please wait...";
                  const lints = await config.app.workerlinter.lint(config.app.current.source);
                  /*  */
                  for (let lint of lints) {
                    config.app.highlights.push({
                      "engine": "Harper",
                      "message": lint.message(),
                      "problem": lint.get_problem_text(),
                      "json": JSON.parse(lint.to_json())
                    });
                  }
                }
                /*  */
                if (config.app.proofreader) {
                  item.textContent = "Checking grammar with Gemini Nano AI, please wait...";
                  const proofreads = await config.app.proofreader.proofread(e.target.value);
                  /*  */
                  if (proofreads.corrections) {
                    for (let i = 0; i < proofreads.corrections.length; i++) {
                      const target = proofreads.corrections[i];
                      const problem = config.app.current.source.substring(target.startIndex, target.endIndex);
                      config.app.highlights.push({
                        "engine": "Gemini",
                        "problem": problem,
                        "message": target.explanation || '',
                        "json": {
                          "language": "en",
                          "problem_text": '',
                          "inner": {
                            "priority": 0,
                            "message": '',
                            "lint_kind": target.type || "Proofreader",
                            "span": {
                              "end": target.endIndex,
                              "start": target.startIndex
                            },
                            "suggestions": [
                              {
                                "ReplaceWith": [
                                  target.correction
                                ]
                              }
                            ]
                          }
                        }
                      });
                    }
                  }
                }
              } else {
                /*  */
              }
              /*  */
              item.textContent = "Grammar check is completed.";
              if (config.elements.loader) config.elements.loader.style.display = "none";
              [...config.elements.suggestions.querySelectorAll("[replacement]")].map(e => e.remove());
              /*  */
              config.app.highlights = config.app.methods.sort(config.app.highlights);
              /*  */
              for (let i = 0; i < config.app.highlights.length; i++) {
                config.app.methods.highlight(config.app.highlights[i]);
              }
              /*  */
              e.target.focus();
              e.target.setSelectionRange(cursor, cursor);
            } catch (e) {
              if (config.elements.loader) config.elements.loader.style.display = "none";
              if (e && e.message) window.alert(e.message);
            }
          }
        }
      }
    },
    "methods": {
      "wait": async function (ms) {
        await new Promise(resolve => window.setTimeout(resolve, ms));
      },
      "color": function (priority) {
        let red = 255;
        /*  */
        priority = Math.max(0, Math.min(priority, 150));
        if (priority <= 100) {
          red = Math.floor(255 - (priority / 100) * 55);
        } else {
          red = Math.floor(200 - ((priority - 100) / 50) * 100);
        }
        /*  */
        return `rgb(${red}, 0, 0)`;
      },
      "error": {
        "builtin": async function (e, m) {
          config.storage.write("builtin", false);
          config.elements.builtin.checked = false;
          /*  */
          await config.app.methods.wait(300);
          window.alert(m.join("\n"));
          e.textContent = m[0];
          /*  */
          document.location.reload();
        }
      },
      "sort": function (e) {
        const groups = new Map();
        /*  */
        for (const item of e) {
          const key = item.problem;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(item);
        }
        /*  */
        for (const group of groups.values()) {
          group.sort((a, b) => {
            const a_start = a.json.inner.span.start;
            const b_start = b.json.inner.span.start;
            if (a_start !== b_start) return a_start - b_start;
            /*  */
            const a_end = a.json.inner.span.end;
            const b_end = b.json.inner.span.end;
            return a_end - b_end;
          });
        }
        /*  */
        const sorted = [...groups.values()].sort((a, b) => {
          const a_start = a[0].json.inner.span.start;
          const b_start = b[0].json.inner.span.start;
          return a_start - b_start;
        });
        /*  */
        return sorted.flat();
      },
      "download": {
        "training": {
          "data": async function () {
            const text = [];
            /*  */
            if (window.Proofreader) {
              const args = config.app.options;
              const item = document.createElement("li");
              /*  */
              config.app.highlights = [];
              config.elements.logs.textContent = '';
              config.elements.logs.appendChild(item);
              config.elements.userarea.value = config.app.current.source;
              config.elements.userinput.textContent = config.app.current.source;
              if (config.elements.loader) config.elements.loader.style.display = "block";
              [...config.elements.suggestions.querySelectorAll("[replacement]")].map(e => e.remove());
              /*  */
              args.monitor = function (m) {
                m.addEventListener("downloadprogress", async function (e) {
                  if (e) {
                    if (e.loaded === e.total) {
                      await config.app.methods.wait(300);
                      document.location.reload();
                    } else {
                      const current = (e.loaded * 100).toFixed(2);
                      item.textContent = `Downloading training data for Gemini Nano AI: ${current}%, please wait...`;
                    }
                  }
                });
              };
              /*  */
              await window.Proofreader.create(args);
            } else {
              text.push("The built-in Gemini Nano AI is not activated in your browser.");
              text.push("Please reload the app and try again.");
              await config.app.methods.error.builtin(item, text);
            }
          }
        }
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
      "highlight": function (e) {
        try {
          const current = {};
          const highlight = {};
          const builtin = config.storage.read("builtin");
          /*  */
          current.index = {};
          current.inner = e.json.inner;
          current.priority = current.inner.priority;
          current.index.end = current.inner.span.end;
          current.index.start = current.inner.span.start;
          current.startend = current.index.start + ':' + current.index.end;
          current.problem = e.problem ? e.problem : config.app.current.source.substring(current.index.start, current.index.end);
          /*  */
          if (config.app.current.dismiss.indexOf(current.startend) === -1) {
            highlight.node = document.createTextNode(current.problem);
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
              const kind = current.inner.lint_kind;
              const type = (kind.charAt(0).toUpperCase() + kind.slice(1));
              const replacement = highlight.suggestions[i].ReplaceWith.join('');
              const engine = (e.engine.charAt(0).toUpperCase() + e.engine.slice(1));
              /*  */
              const title = document.createElement("div");
              const button = document.createElement("div");
              const reason = document.createElement("div");
              const accept = document.createElement("div");
              const actions = document.createElement("div");
              const dismiss = document.createElement("div");
              /*  */
              button.title = e.message;
              title.className = "title";
              reason.className = "reason";
              accept.textContent = "Accept";
              actions.className = "actions";
              dismiss.className = "dismiss";
              dismiss.textContent = "Dismiss";
              button.setAttribute("replacement", replacement);
              button.setAttribute("problem", current.problem);
              button.setAttribute("startend", current.startend);
              button.addEventListener("click", config.app.listener.highlight);
              accept.addEventListener("click", config.app.listener.button.accept);
              dismiss.addEventListener("click", config.app.listener.button.dismiss);
              accept.className = current.inner.suggestions.length ? "accept" : "accept manual";
              title.textContent = builtin ? type + ' ' + '(' + engine + ')' + " - " + replacement : type + " - " + replacement;
              reason.textContent = current.inner.suggestions.length ? e.message : e.message + " Please review and correct manually.";
              /*  */
              button.appendChild(title);
              if (e.message) button.appendChild(reason);
              actions.appendChild(accept);
              actions.appendChild(dismiss);
              button.appendChild(actions);
              config.elements.suggestions.appendChild(button);
            }
          }
        } catch (e) {
          if (e && e.message) {
            window.alert(e.message);
          }
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
