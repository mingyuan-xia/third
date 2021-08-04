const { Command } = require('commander');
const cmd = new Command('account');
const inquirer = require('inquirer');
const inq_autocomplete = require('inquirer-autocomplete-prompt');
const fuzzy = require('fuzzy');
const {driver} = require('../../lib');

inquirer.registerPrompt('autocomplete', inq_autocomplete);

cmd.action(async ()=>{
    const r = await driver.account.info();
    console.log(r);
});

function select_fingerprint (fingerprints) {

    function search_fingerprint (input) {
        input = input || '';
        return new Promise((resolve, reject) => {
            resolve(fuzzy.filter(input, fingerprints).map(el=>el.original.replace(/(.{4})/g, '$1 ')));
        });
    }

    return new Promise((resolve, reject)=>{
        inquirer.prompt({
            type     : 'autocomplete',
            name     : 'fingerprint',
            message  : '请选择要操作的指纹',
            emptyText: '找不到结果',
            source   : (answers, input) => {
                return search_fingerprint(input);
            },
            pageSize: 4,
        }).then(answer=>{
            return resolve(answer.fingerprint.replace(/ /g, ''));
        });
    });
}

cmd
    .command('login')
    .arguments('<keyid>')
    .action(async (keyid)=>{
        let r = await driver.account.fingerprints(keyid);
        if(404 === r.code) {
            console.error(r.message);
            process.exit(-1);
        }
        const fpr = await select_fingerprint(r.list);
        r = await driver.account.login(fpr);
        console.log(r);
    });

cmd
    .command('allow')
    .action(async ()=>{
        let r = await driver.account.requests();
        if(r.list.length === 0) {
            console.error('没有登录请求');
            process.exit(-1);
        }
        const fpr = await select_fingerprint(r.list);
        r = await driver.account.device.add(fpr);
        console.log(r);
    });

cmd
    .command('remove')
    .action(async ()=>{
        let r = await driver.account.device.list();
        if(r.list.length === 0) {
            console.error('没有设备');
            process.exit(-1);
        }
        const fpr = await select_fingerprint(r.list);
        r = await driver.account.device.remove(fpr);
        console.log(r);
    });

module.exports = cmd;