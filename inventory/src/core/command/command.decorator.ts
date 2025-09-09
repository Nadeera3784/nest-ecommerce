import { SetMetadata } from '@nestjs/common';
import 'reflect-metadata';
import { Options, PositionalOptions } from 'yargs';

export const COMMAND_HANDLER_METADATA = '__command-handler-metadata__';
export const COMMAND_ARGS_METADATA = '__command-args-metadata__';

export enum CommandParamTypes {
  POSITIONAL = 'POSITIONAL',
  OPTION = 'OPTION',
  ARGV = 'ARGV',
}

export type CommandParamMetadata<O> = {
  [type in CommandParamTypes]: Array<CommandParamMetadataItem<O>>;
};

export interface CommandParamMetadataItem<O> {
  index: number;
  option: O;
}

export interface CommandMetadata {
  params: CommandParamMetadata<CommandPositionalOption | CommandOptionsOption>;
  option: CommandOption;
}

export interface CommandOption {
  aliases?: string[] | string;
  command: string[] | string;
  describe?: string | false;
}

export function Command(option: CommandOption): MethodDecorator {
  return (target, key, descriptor) => {
    const metadata: CommandMetadata = {
      option,
      params: Reflect.getMetadata(COMMAND_ARGS_METADATA, descriptor.value),
    };
    SetMetadata(COMMAND_HANDLER_METADATA, metadata)(target, key, descriptor);
  };
}

export interface CommandPositionalOption extends PositionalOptions {
  name: string;
}

export const Positional = (
  option?: CommandPositionalOption,
): ParameterDecorator =>
  createCommandParamDecorator(CommandParamTypes.POSITIONAL)(option);

export interface CommandOptionsOption extends Options {
  name: string;
}

export const Option = (option?: CommandOptionsOption): ParameterDecorator =>
  createCommandParamDecorator(CommandParamTypes.OPTION)(option);

export const Argv = (option?: CommandPositionalOption): ParameterDecorator =>
  createCommandParamDecorator(CommandParamTypes.ARGV)(option);

const createCommandParamDecorator = (paramtype: CommandParamTypes) => {
  return (option?: CommandPositionalOption | CommandOptionsOption) =>
    (target, key, index) => {
      const params =
        Reflect.getMetadata(COMMAND_ARGS_METADATA, target[key]) || {};
      Reflect.defineMetadata(
        COMMAND_ARGS_METADATA,
        {
          ...params,
          [paramtype]: [...(params[paramtype] || []), { index, option }],
        },
        target[key],
      );
    };
};
