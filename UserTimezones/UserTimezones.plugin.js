/**
 * @name UserTimezones
 * @author Styro
 * @authorId 314738406641106945
 * @description Shows the time for other people on their profile.
 * @version 1.0.0
 * @authorLink https://github.com/Styro457
 * @source https://github.com/Styro457/BetterDiscordPlugins/blob/main/UserTimezones/UserTimezones.plugin.js
 * @updateUrl https://raw.githubusercontent.com/Styro457/BetterDiscordPlugins/main/UserTimezones/UserTimezones.plugin.js
 */
const request = require("request");
const fs = require("fs");
const path = require("path");

const config = {
    info: {
        name: "UserTimezones",
        authors: [
            {
                name: "Styro",
                discord_id: "314738406641106945",
                github_username: "Styro457",
            }
        ],
        version: "1.0.0",
        description: "Shows the time for other people on their profile.",
        github: "https://github.com/Styro457/BetterDiscordPlugins/blob/main/UserTimezones/UserTimezones.plugin.js",
        github_raw:
            "https://raw.githubusercontent.com/Styro457/BetterDiscordPlugins/main/UserTimezones/UserTimezones.plugin.js",
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
    defaultConfig: [
        {
            type: 'switch',
            id: 'showInPopout',
            name: 'Show In UserPopout',
            note: 'Whether the time should be displayed in the user popout',
            value: true
        },
        {
            type: 'switch',
            id: 'showInProfile',
            name: 'Show In UserProfile',
            note: 'Whether the time should be displayed in the user profile',
            value: true
        },
        {
            type: 'switch',
            id: '_24HourTime',
            name: 'Use 24 Hour Clock',
            note: 'Whether the time should be displayed using the 24 hour clock format',
            value: false
        }
    ]
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
            const now = new Date();
            this.state = {
                time: new Date(now.getTime() + (props.timezoneOffset+now.getTimezoneOffset()) * 60000)
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

        onStart(message) {
            this.patchUserPopout();
            //this.patchProfileActions();
            this.patchUserContextMenus();

            PluginUtilities.addStyle("userTime", `
           .userTime {
             margin-top: 5px !important;
           }
           `)

            PluginUtilities.addStyle("searchableDropdown", `
           .sDropdown {
             width: 100%;
           }
           `)

/*            BdApi.alert("Choose Timezone", React.createElement(Select, {},
                React.createElement("option", {value: "A"}, "Option A"),
                React.createElement("option", {value: "B"}, "Option B"),
                React.createElement("option", {value: "C"}, "Option C")
            ))*/

        }

        onStop() {
            Patcher.unpatchAll();
            PluginUtilities.removeStyle("userTime");
            PluginUtilities.removeStyle("searchableDropdown");
        }

        patchUserPopout() {
            Patcher.after(UserPopout, 'UserPopoutInfo', (_this, [props], ret) => {
                if(this.settings.showInPopout) {
                    const timezone = this.settings[props.user.id].timezone;
                    if(timezone !== undefined) {
                        ret.props.children[1].props.children.push(React.createElement(Clock, {
                            className: "userTime",
                            timezoneOffset: timezone
                        }));
                    }
                }
            })
        }

        patchUserContextMenus() {
            for (const UserContextMenu of UserContextMenus) Patcher.after(UserContextMenu, "default", ((_this, [props], ret) => {
                const tree = ret.props.children.props.children;
                    tree.splice(7, 0, React.createElement(Menu.MenuGroup, null, React.createElement(Menu.MenuItem, {
                        id: "set-timezone",
                        label: "Set Timezone",
                        action: () => {

                            const timezones = [
                                {display: "-12:00", minutes: -720, regions:["US, Baker Island", "US, Howland Island"]},
                                {display: "-11:00", minutes: -660, regions:["US, American Samoa", "New Zealand, Niu"]},
                                {display: "-10:00", minutes: -600, regions:["US, Hawaii", "US, Aleutian Islands", "New Zealand, Cook Islands"]},
                                {display: "-09:30", minutes: -570, regions:["France, Marquesas Islands"]},
                                {display: "-09:00", minutes: -540, regions:["US, Alaska"]},
                                {display: "-08:00", minutes: -480, regions:["US, California", "US, Idaho", "US, Nevada", "US, Oregon", "US, Washington", "Canada, British Columbia", "UK, Pitcarin Islands"]},
                                {display: "-07:00", minutes: -420, regions:["Canada, Alberta", "Canada, British Columbia", "Canada, Northwest Territories", "Canada, Nunavut", "Canada, Saskatchewan", "Canada Yukon", "US, Arizona", "US, Colorado", "US, Idaho", "US, Kansas", "US, Montana", "US, Nebraska", "US, Nevada", "US, New Mexico", "US, North Dakota", "US, Oregon", "US South Dakota", "US, Texas", "US, US, Utah", "US, Wyoming", "Mexico, Baja California Sur", "Mexico, Sur", "Mexico, Chihuahua", "Mexico, Nayarit", "Mexico, Sinalola", "Mexico, Sonora"]},
                                {display: "-06:00", minutes: -360, regions:["Belize", "Canada, Manitoba", "Canada, Nunavut", "Canada, Ontario", "Canada, Saskatchewan", "Chile, Easter Islands", "Costa Rica", "Ecuador, Galápagos Islands", "El Salvador", "Guatemala", "Honduras", "Mexico", "Nicaragua", "US, Alabama", "US, Arkansas", "US, Florida", "US, Illinois", "US, Indiana", "US, Iowa", "US, Kansas", "US, Kentucky", "US, Louisiana", "US, Michigan", "US, Minnesota", "US, Mississippi", "US, Missouri", "US, Nebraska", "US, North Dekota", "US, Oklahoma", "US, South Dakota", "US, Tennesse", "US, Texas", "US, Wisconsin"]},
                                {display: "-05:00", minutes: -300, regions:["Bahamas", "Brazil, Acre", "Brazil, Amazonas", "Canada, Nunavut", "Canada, Ontario", "Canada Quebec", "Colombia", "Cuba", "Ecuador", "Haiti", "Jamaica", "Mexico, Quintana Roo", "Panama", "Peru", "US, Delaware", "US, District of Columbia", "US, Florida", "US, Georgia", "US, Indiana", "US, Kentucky", "US, Maryland", "US, Michigan", "US, Connecticut", "US, Massachusetts", "US, Maine", "US, New Hampshire", "US, Rhode Islands", "US, Vermont", "US, New Jersey", "US, New York", "US, North Carolina", "US, Ohio", "US, Pennsylvania", "Us, South Carolina", "US, Tennessee", "US, Virginia", "US, West Virginia", "US, Navassa Island"]},
                                {display: "-04:00", minutes: -240, regions:["Antigua and Barbuda", "Barbados", "Bolivia", "Brazil, Amazonas", "Canada, New Brunswick", "Canada, Newfoundland and Labrador", "Canada, Nova Scotia", "Canada, Prince Edward Island", "Canada, Quebec", "Chile", "Dominica", "Dominican Republic", "Grenada", "Guyana", "Paraguay", "Saint Kitts and Nevis", "Saint Lucia", "Saint VIncent and the Grenadalines", "Trinidad and Tobago", "US, Puerto Rico", "US, Virgin Islands", "Venezuela"]},
                                {display: "-03:30", minutes: -210, regions:["Canada, Newfoundland and Labrador"]},
                                {display: "-03:00", minutes: -180, regions:["Argentina", "Brazil", "Chile, Magallanes/Antarctic", "France, French Guiana", "Suriname", "Uruguay"]},
                                {display: "-02:00", minutes: -120, regions:["Brazil, Fernando de Noronha"]},
                                {display: "-01:00", minutes: -60, regions:["Cape Verde", "Portugal, Azores Islands"]},
                                {display: "+00:00", minutes: 0, regions:["Burkina Faso", "Côte d'Ivoire", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Iceland", "Ireland", "Liberia", "Mali", "Mauritania", "Portugal", "São Tomé and Príncipe", "Spain, Canary Islands", "Senegal", "Sierra Leone", "Togo", "United Kingdom"]},
                                {display: "+01:00", minutes: 60, regions:["Albania", "Algeria", "Andorra", "Angola", "Austria", "Belgium", "Benin", "Bosnia and Herzegovina", "Cameroon", "Central African Republic", "Chad", "Republic of Congo", "Democratic Republic of Congo", "Croatia", "Croatia", "Czech Republic", "Denmark", "Equatorial Guinea", "French", "Gabon", "Germany", "Hungary", "Italy", "Kosovo", "Liechtenstein", "Luxembourg", "Malta", "Monaco", "Montenegro", "Morocco", "Netherlands", "Niger", "Nigeria", "North Macedonia", "Norway", "Poland", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweeden", "Switzerland", "Tunisia", "UK, Gibraltar", "Vatican City", "Western Sahara"]},
                                {display: "+02:00", minutes: 120, regions:["Botswana", "Bulgaria", "Burundi", "Cyprus", "Egypt", "Estonia", "Eswatini (Swaziland)", "Finland", "Greece", "Israel", "Jordan", "Latvia", "Lebanon", "Lesotho", "Lithuania", "Libya", "Malawi", "Moldova", "Mozambique", "Namibia", "Palestinian Territories", "Romania", "Russia", "Rwanda", "South Africa", "South Sudan", "Sudan", "Syria", "Ukraine", "Zambia", "Zimbabwe"]},
                                {display: "+03:00", minutes: 180, regions:["Bahrain", "Belarus", "Comoros", "Djibouti", "Eritrea", "Ethiopia", "Iraq", "Kenya", "Kuwait", "Madagascar", "Qatar", "Russia, Moscow", "Saudi Arabia", "Somalia", "South Africa", "Tanzania", "Turkey", "Uganda", "Ukraine, Crimea", "Yemene"]},
                                {display: "+03:30", minutes: 210, regions:["Iran"]},
                                {display: "+04:00", minutes: 240, regions:["Armenia", "Azerbaijan", "Georgia", "Mauritius", "Oman", "Russia, Samara", "Seychelles", "United Arab Emirates"]},
                                {display: "+04:30", minutes: 270, regions:["Afghanistan"]},
                                {display: "+05:00", minutes: 300, regions:["Kazakhstan, Atyrau", "Maldives", "Pakistan", "Russia, Yekaterinburg", "Tajikistan", "Turkmenistan", "Uzbekistan"]},
                                {display: "+05:30", minutes: 330, regions:["India", "Sri Lanka"]},
                                {display: "+05:45", minutes: 345, regions:["Nepal"]},
                                {display: "+06:00", minutes: 360, regions:["Bangladesh", "Bhutan", "Kazakhstan", "Kyrgyzstan", "Russia, Omsk"]},
                                {display: "+06:30", minutes: 390, regions:["Myanmar"]},
                                {display: "+07:00", minutes: 420, regions:["Cambodia", "Indonesia, Java", "Laos", "Mongolia", "Thailand", "Vietnam"]},
                                {display: "+08:00", minutes: 480, regions:["Australia, western Australia", "Brunei", "China", "Hong Kong", "Indonesia, Sulawesi", "Macau", "Malaysia", "Mongolia", "Philippines", "Singapore", "Taiwan"]},
                                {display: "+08:45", minutes: 525, regions:["Australia, Eucla"]},
                                {display: "+09:00", minutes: 540, regions:["East Timor", "Indonesia, Papua", "Japan", "North Korea", "Palau", "South Korea"]},
                                {display: "+09:30", minutes: 570, regions:["Australia"]},
                                {display: "+10:00", minutes: 600, regions:["Australia", "Micronesia", "Papua new Guinea", "Russia, Vladivostok"]},
                                {display: "+10:30", minutes: 630, regions:["Australia"]},
                                {display: "+11:00", minutes: 660, regions:["Australia", "Micronesia", "Solomon Islands", "Vunuatu"]},
                                {display: "+12:00", minutes: 720, regions:["Fiji", "Kiribati", "Marshall Islands", "Nauru", "New Zealand", "Tuvalu"]},
                                {display: "+12:45", minutes:765, regions:["New Zealand, Chatham Islands"]},
                                {display: "+13:00", minutes: 780, regions:["Kiribati", "New Zealand, Tokelau", "Samoa", "Tonga"]},
                                {display: "+14:00", minutes: 840, regions:["Kiribati, Line Islands"]}
                            ]

                            let timezone = undefined;
                            if(this.settings[props.user.id] !== undefined) {
                                timezone = this.settings[props.user.id].timezoneOption;
                            }

                            const timezoneOptions = [];
                            for(const timezone of timezones) {
                                for(const region of timezone.regions) {
                                    //timezoneOptions.push({value: timezone.minutes.toString() + "|" + region, label: "(UTC " + timezone.display + ") " + region})
                                    timezoneOptions.push(React.createElement('option', {value: "(UTC " + timezone.display + ") (" + timezone.minutes + ") " + region}))
                                }
                            }



                            const dropdownMenu = React.createElement('div', {
                                children: [
                                    React.createElement('input', {
                                        list: 'timezones',
                                        className: "sDropdown select-2fjwPw open-kZ53_U lookFilled-22uAsw",
                                        onChange: (event) => {
                                            const input = event.target.value;
                                            let minutes = 0;
                                            if(input.includes("(")) {
                                                minutes = Number(input.split("(")[2].split(")")[0]);
                                            }
                                            this.settings[props.user.id] = {timezoneOption: input, timezone: minutes};},
                                            placeholder: timezone
                                        }),
                                    React.createElement('datalist', {
                                        id: 'timezones',
                                        children: timezoneOptions
                                    })
                                ]
                            })
                            BdApi.alert("Choose Timezone", dropdownMenu)
                        }
                    })
                ));
            }));
        }

        getSettingsPanel() { return this.buildSettingsPanel().getElement(); }

    }

    return plugin;
})(global.ZeresPluginLibrary.buildPlugin(config));