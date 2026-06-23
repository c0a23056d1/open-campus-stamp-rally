Open Campus Stamp Rally/OC Passport

オープンキャンパス向けのスタンプラリーシステムです。
ユーザー登録時にsymbolウォレットを自動生成し、NFT情報をDBに作成します。
QRコードで研究室を訪問し、スタンプ数やレベルを更新していきます。

使用技術
・Next.js
・TypeScript
・Prisma
・SQLite
・Symbol SDK
・bcrypt

セットアップ手順
1. リポジトリをクローン
git clone https://github.com/c0a23056d1/open-campus-stamp-rally.git
cd open-campus-stamp-rally

2. developブランチへ移動
git checkout develop

3. パッケージをインストール
npm install

4. .envを作成
プロジェクト直下に.envを作成し以下を記述
DATABASE_URL="file:./dev.db"
WALLET_SECRET_KEY="12345678901234567890123456789012"

WALLET_SECRET_KEYはウォレット秘密鍵の暗号化に使用します・
開発用では32文字ちょうどの文字列を設定してください

5. Prisma Clientを生成
npx prisma generate

6. データベースを作成
npx prisma migrate dev

7. 開発サーバー起動
npm run dev

ブラウザで以下を開きます：http://localhost:3000


## 主な画面

新規登録
http://localhost:3000/register
ユーザー名、メールアドレス、パスワードを入力して登録します。
登録時に以下のデータが作成されます
・User
・Wallet
・NFT

ログイン
http://localhost:3000/login
登録済みのメールアドレスとパスワードでログインします。

ダッシュボード
http://localhost:3000/dashboard
ログイン後に以下の情報を表示します
・ユーザー情報
・NFT(OC Passport情報)
・NFT ID
・Level
・称号
・スタンプ数
・symbolアドレス(将来的にはユーザーには見えなくする)
・取得スタンプ一覧


## Prisma Studio
DBの中身を確認したいときは以下を実行します
npx prisma studio

起動後、以下にアクセスします。
http://localhost:5555


## 現在実装済みの機能
・ユーザー新規登録
・パスワードハッシュ化
・ログイン
・ダッシュボード表示
・PrismaによるDB管理
・symbolウォレット自動生成
・秘密鍵の暗号化保存
・初期NFTデータのDB作成

## 今後実装予定
・QRコード読み取り
・スタンプ取得
・StampLog保存
・NFTのstampCount更新
・Level更新
・dNFT表示デザイン
・symbol Metadata更新
・初期NFTオンチェーン付与
・DAO投票機能
・チャット機能

## Git運用ルール

main
安定版のブランチです。
直接作業せず、developからPullRequestで反映する

develop
開発統合用のブランチです。
各機能のブランチ作業が完了したらdevelopへマージします。
