/**
 * @name UserTimezones
 * @author Styro
 * @description Shows the time for other people on their profile.
 * @version 1.0.0
 * @source https://github.com/Styro457/BetterDiscordPlugins/tree/dev/UserTimezones
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

    const UserContextMenus = WebpackModules.findAll((module => module.default?.displayName.endsWith("UserContextMenu")));
    const UserGenericContextMenu = WebpackModules.find((m => "UserGenericContextMenu" === m.default?.displayName));
    UserContextMenus.push(UserGenericContextMenu);

    const Menu = BdApi.findModuleByProps('MenuItem');

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
    }

    class plugin extends Plugin {
        constructor() {
            super();
        }

        onStart() {
            this.patchUserPopout();
            //this.patchProfileActions();
            this.patchUserContextMenus();

            PluginUtilities.addStyle("userTime", `
           .userTime {
             margin-top: 5px !important;
           }
           `)
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

        patchUserContextMenus() {
            for (const UserContextMenu of UserContextMenus) Patcher.after(UserContextMenu, "default", ((_this, [props], ret) => {
                const tree = ret.props.children.props.children;
                    tree.splice(7, 0, React.createElement(Menu.MenuGroup, null, React.createElement(Menu.MenuItem, {
                        id: "set-timezone",
                        label: "Set Timezone",
                        children: [React.createElement(Menu.MenuGroup, null, React.createElement(Menu.MenuItem, {
                            color: "colorDanger",
                            label: "Reset Preferences",
                            id: "reset",
                            action: () => {
/*                                delete settings[props.user.id];
                                this.saveSettings(settings);
                                settings[props.user.id] = {};
                                external_PluginApi_namespaceObject.Toasts.success(`Successfully cleared preferences for <strong>${props.user}</strong>!`);*/
                                BdApi.alert("BUTTON");
                            }
                        }))]
                    })
                ));
            }));
        }

    }

    return plugin;
})(global.ZeresPluginLibrary.buildPlugin(config));