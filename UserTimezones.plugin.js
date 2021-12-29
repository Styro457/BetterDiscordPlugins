/**
 * @name UserTimezones
 * @author Styro
 * @description Shows the time for other people on their profile.
 * @version 0.0.1
 */

const request = require("request");
const fs = require("fs");
const path = require("path");

const config = {
    info: {
        name: "UserTimezones",
        authors: [
            {
                name: "Styro"
            }
        ],
        version: "0.0.1",
        description: "Shows the time for other people on their profile.",
    },
    changelog: [
        {
            title: "Fixes",
            type: "fixed",
            items: [
                "Timer continues to count after rejoining the call."
            ]
        }
    ],
    defaultConfig: []
};

module.exports = !global.ZeresPluginLibrary ? class {
    constructor() {
        this._config = config;
    }

    load() {
        BdApi.showConfirmationModal("Library plugin is needed",
            `The library plugin needed for this plugin is missing. Please click Download Now to install it.`, {
                confirmText: "Download",
                cancelText: "Cancel",
                onConfirm: () => {
                    request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", (error, response, body) => {
                        if (error)
                            return electron.shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");

                        fs.writeFileSync(path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body);
                    });
                }
            });
    }

    start() { }

    stop() { }
} : (([Plugin, Library]) => {
    const { DiscordModules, WebpackModules, Patcher, PluginUtilities } = Library;
    const { React } = DiscordModules;
    const UserPopout = WebpackModules.getByProps("UserPopoutProfileText");

    class Clock extends React.Component {

        constructor(props) {
            super(props);
            this.timezoneOffset = 0.0;
            const now = new Date();
            this.state = {
                time: new Date(now - now.getTimezoneOffset() + this.timezoneOffset * 3600 * 1000)
            };
        }

        componentDidMount() {
            this.intervalID = setInterval(
                () => this.tick(),
                1000
            );
        }
        componentWillUnmount() {
            clearInterval(this.intervalID);
        }

        tick() {
            this.setState({
                time: new Date(this.state.time.getTime() + 1000)
            })
        }

        render() {
            return React.createElement("div", { className: "userTime date-YN6TCS textRow-19NEd_" }, `Time: ${this.state.time.toLocaleTimeString()}`);
        }
    };

    class plugin extends Plugin {
        constructor() {
            super();
        }


        onStart() {
            this.patchUserPopout()

            PluginUtilities.addStyle("userTime", `
           .userTime {
             margin-top: 5px !important;
           }
           `)

            WebpackModules.
        }

        onStop() {
            Patcher.unpatchAll();
            PluginUtilities.removeStyle("userTime");
        }

        patchUserPopout() {
            Patcher.after(UserPopout, 'UserPopoutInfo', (_this, [props], ret) => {
                ret.props.children[1].props.children.push(React.createElement(Clock, {className: "userTime", timeZone: 0.0}));
            })
        }

    }

    return plugin;
})(global.ZeresPluginLibrary.buildPlugin(config));