import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FeedParser from 'feedparser';
import fetch from 'node-fetch';
import { FeedData } from './types/FeedData.type';
// @ts-ignore
import ArticleIDResolver from './utils/ArticleIDResolver';
// @ts-ignore
import Article from './utils/Article';

@Injectable()
export class FeedFetcherService {
  constructor(private readonly configService: ConfigService) {}

  async fetchFeed(url: string) {
    const inputStream = await this.fetchFeedStream(url);

    const { articleList, idType } = await this.parseFeed(inputStream);

    const articles = this.convertRawObjectsToArticles(articleList);

    return {
      articles,
      idType,
    };
  }

  async fetchFeedStream(url: string): Promise<NodeJS.ReadableStream> {
    const userAgent = this.configService.get<string>('feedUserAgent');

    const res = await fetch(url, {
      timeout: 15000,
      follow: 5,
      headers: {
        'user-agent': userAgent || '',
      },
    });

    if (!res.ok) {
      throw new Error(`Non-200 status code (${res.status})`);
    }

    return res.body;
  }

  private async parseFeed(
    inputStream: NodeJS.ReadableStream,
  ): Promise<FeedData> {
    const feedparser = new FeedParser({});
    const idResolver = new ArticleIDResolver();
    const articleList: FeedParser.Item[] = [];

    return new Promise<FeedData>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Feed parsing took too long'));
      }, 10000);

      inputStream.on('error', (err: Error) => {
        // feedparser may not handle all errors such as incorrect headers. (feedparser v2.2.9)
        reject(new Error(err.message));
      });

      feedparser.on('error', (err: Error) => {
        if (err.message === 'Not a feed') {
          reject(
            new Error(
              'That is a not a valid feed. Note that you cannot add just any link. ' +
                'You may check if it is a valid feed by using online RSS feed validators',
            ),
          );
        } else {
          reject(new Error(err.message));
        }
      });

      feedparser.on('readable', function (this: FeedParser) {
        let item;

        do {
          item = this.read();

          if (item) {
            idResolver.recordArticle(item);
            articleList.push(item);
          }
        } while (item);
      });

      feedparser.on('end', () => {
        clearTimeout(timeout);

        if (articleList.length === 0) {
          return resolve({ articleList });
        }

        clearTimeout(timeout);
        const idType = idResolver.getIDType();

        for (const article of articleList) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          article._id = ArticleIDResolver.getIDTypeValue(article, idType);
        }

        resolve({ articleList, idType });
      });

      inputStream.pipe(feedparser);
    });
  }

  convertRawObjectsToArticles(feedparserItems: FeedParser.Item[]): Article[] {
    return feedparserItems.map(
      (item) =>
        new Article(
          item,
          {
            feed: {
              formatTables: false,
              imgLinksExistence: true,
              imgPreviews: true,
            },
          },
          {
            dateFallback: false,
            timeFallback: false,
            dateFormat: 'ddd, D MMMM YYYY, h:mm A z',
            formatTables: false,
            imgLinksExistence: true,
            imgPreviews: true,
            timezone: 'UTC',
          },
        ),
    );
  }
}
