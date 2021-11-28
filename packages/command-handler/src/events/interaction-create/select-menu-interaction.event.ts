import { SelectMenuInteraction } from 'discord.js';
import { Container } from 'inversify';
import mapOfResponses from '../../responses';
import ResponseInterface from '../../responses/response.interface';
import { commandContainerSymbols, CommandLogger } from '../../types/command-container.type';
import InteractionCustomId from '../../types/interaction-custom-id.type';
import parseInteractionCustomId from '../../utils/parse-interaction.custom-id';

function getTaskFromCustomId<T>(customId: InteractionCustomId<T>) {
  if (customId.executeFinalTask) {
    return customId.finalTask;
  }

  return customId.task;
}

async function selectMenuInteractionEvent(
  interaction: SelectMenuInteraction,
  container: Container,
) {
  const logger = container.get<CommandLogger>(commandContainerSymbols.CommandLogger);
  const { customId: customIdString } = interaction;
  const customIdObject = parseInteractionCustomId<Record<string, any>>(customIdString);

  if (!customIdObject) {    
    logger.debug(`No custom id found for ${customIdString}`);

    return;
  }


  const task = getTaskFromCustomId(customIdObject);

  const Response = mapOfResponses.get(task);

  if (!Response) {
    logger.debug(`No response function found for custom id ${customIdObject.task}`);

    return;
  }


  logger.setContext({
    ...logger.context,
    response: {
      customId: customIdObject,
      values: interaction.values,
    },
  });

  container.bind(Response).to(Response);
  const response = container.get<ResponseInterface>(Response);
  await response.execute(interaction, customIdObject);
}

export default selectMenuInteractionEvent;
