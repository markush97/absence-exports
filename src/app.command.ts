import { Command, CommandRunner, Option } from 'nest-commander';

interface BasicCommandOptions {
  string?: string;
  boolean?: boolean;
  number?: number;
}

@Command({ name: 'report', description: 'Create a report of absences' })
export class AppCommand extends CommandRunner {
  async run(
    passedParam: string[],
    options?: BasicCommandOptions,
  ): Promise<void> {
    console.log('test');
    console.log(passedParam);
    console.log(options);
  }

  @Option({
    flags: '-n, --number [number]',
    description: 'A basic number parser',
  })
  parseNumber(val: string): number {
    return Number(val);
  }
}
