import { resolve, basename, join } from 'path';
import { copySync, ensureDirSync } from 'fs-extra';
import { writeFileSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { configTargets } from './configTargets';
import { errorApp } from './errorApp';

export const createApp = ({ name, target }): void => {
    if(!name) {
        errorApp(name);
    }
    const root      = resolve(name);
    const appName   = basename(root);
    validationAppName(appName);
    let { templateDir, dependencies } = configTargets[target];
    ensureDirSync(root);
    process.chdir(root);
    copySync(templateDir, root)
    copyPackage(appName, templateDir, root);
    installPackages(name, dependencies);
}

const installPackages = (name:string, dependency: string[]): void => {
    let command: string = 'npm';
    let args: string[] = [
        'install',
        '--save-dev'
    ].concat(dependency);

    let config = { 
        stdio: 'inherit',
        shell: true
    };

    console.log('');
    console.log('Installing packages for your application');
    const child = spawn(command, args, config);
    child.on('close', () => {
        console.log('');
        console.log(`Project ${chalk.green(name)} created!`);
        console.log(`use: cd ${chalk.green(name)} and ${chalk.green('npm start')}`);
        console.log('');
    });
}

const validationAppName = (appName: string): void => {
    const validateProjectName = require( 'validate-npm-package-name');
    let results = validateProjectName(appName);
    let dependency = ['webpack', 'webpack-dev-server'];
    if(!results.validForNewPackages){
        console.error(`Could not create project named: ${chalk.red(appName)}`);
        console.log('please correct:');
        results.errors.forEach(error => {
            console.log(`    ${chalk.red('*')} ${error}`);
        });
        process.exit(1);
    }
    if(dependency.indexOf(appName) !== -1){
        console.error(`Could not create project named ${chalk.red(appName)}.`);
        console.error('Please change the name of the application, a dependency has the same name.');
        process.exit(1);
    }
}

const copyPackage = (name: string, templateDir: string, root: string): void => {
    const templatepackage = join(templateDir, 'package.json');
    let packageJson = JSON.parse(readFileSync(templatepackage, 'utf-8'));
    packageJson.name = name;
    writeFileSync(join(root, 'package.json'), JSON.stringify(packageJson, null, 2));
}