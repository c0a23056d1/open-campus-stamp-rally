Open Campus Stamp Rally/OC Passport

オープンキャンパス向けのスタンプラリーシステムです。
ユーザー登録時にsymbolウォレットを自動生成し、NFT情報をDBに作成します。
管理者が研究室・展示スポット用のQRコードを発行し、ユーザーはQRコードを読み取ってスタンプを取得します。
取得スタンプ数に応じてNFT(OC Passport)のレベルや称号が変更されます。

使用技術
・Next.js
・TypeScript
・Prisma
・SQLite
・Symbol SDK
・bcrypt
・html5-qrcode
・qrcode

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
登録時に以下のデータが作成されます。
・User
・Wallet
・NFT

また、登録時にsymbolウォレットを自動生成し、秘密鍵は暗号化してDBへ保存します。

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

スタンプ取得画面
http://localhost:3000/scan
ユーザーがQRコードをカメラで読み取り、スタンプを取得する画面です。
読み取り成功後、いかが実行されます。

・Spotの特定
・StampLog保存
・スタンプ数の再計算
・OC PassportのstampCount更新
・Level/称号 更新
・ダッシュボードの反映

管理者トップ画面
http://localhost:3000/admin
管理者ユーザー専用の画面です。
User.isAdmin = true のユーザーのみアクセスできます。
現時点では以下への導線があります。

・QRコード発行画面
・(将来実装予定)ユーザー管理
・(将来実装予定)スポット分析
・(将来実装予定)投票管理

QRコード発行画面
http://localhost:3000/admin/spots
管理者が研究室などを登録し、スタンプ取得用のQRコードを発行する画面です。

登録できる情報：
・スポット名
・場所
・説明文
登録時にqrSecretCodeを生成し、その内容をQRコードとして表示します

## Prisma Studio
DBの中身を確認したいときは以下を実行します
npx prisma studio

起動後、以下にアクセスします。
http://localhost:5555


## 現在実装済みの機能
認証・ユーザー管理
・ユーザー新規登録
・パスワードハッシュ化
・ログイン
・ログアウト
・ログイン後ダッシュボード表示

Wallet/Passport(NFT)初期化
・symbolウォレットの自動生成
・秘密鍵の暗号化保存
・初期NFTデータ(OC Passport)のBD作成

管理者機能
http://localhost:3000/admin
・管理者権限チェック(isAdmin = true のユーザーのアクセス可能)
・Spot登録
・QRシークレットコード生成
・QRコード発行/表示

スタンプラリー機能
・QRコード読み取り(カメラ)
・Spot特定
・StampLog保存
・同一スポットの重複取得防止
・スタンプ再計算
・NFT(OC Passport)のstampCount更新
・level/称号 更新
・ダッシュボードへの反映

現在のlevel仕様
現状はスタンプ数に応じて以下のようにレベルアップします。

・0個→Level 0 / Beginner
・1個→Level 1 / Explorer
・3個→Level 2 / Research Supporter
・5個→Level 3 / Campus Member
・7個以上→Level 4 / Campus Ambassador

## データモデル概要
主に以下のテーブルを利用しています。
・User：ユーザー情報、ログイン情報、管理者フラグ
・Wallet：symbolアドレス、公開鍵、暗号化秘密鍵
・NFT：OC Passportの状態、NFT ID、level、title、stampCountなど
・Spot：スタンプ対象の研究室/展示スポット情報(スポット名、場所、説明、QR用シークレットコード)
・StampLog：ユーザーがどのSpotを訪問したのかを記録
・ChatRoom,ChatMessage：将来的なチャット機能
・Proposal,vote：将来的なDAO投票機能用

## API概要(現状)
認証系
・POST /api/auth/register：ユーザー登録、Wallet/NFT初期作成
・POST /api/auth/login：ログイン

管理者系
・GET /api/admin/chack：管理者権限確認
・GET /api/admin/spots：登録済みSpot一覧表示
・POST /api/admin/spots：QR発行

スタンプ系
・POST /api/stamp/scan：QRコード読み取り結果を受け取り、スタンプ取得処理を実行

## 今後実装予定
Web3 連携
・初期NFTのオンチェーン付与
・Symbol Metadata更新
・dNFTとしての成長状態のオンチェーン反映
・トランザクションハッシュやモザイクIDの管理

UI/UX改善
・OC Passportのデザイン強化
・dNFT風の見た目変化(レベルに応じた画像・フレーム・色変化)
・管理者画面UI改善
・エラーメッセージ/成功メッセージの改善

DAO/コミュニティ機能
・Proposal作成
・投票機能
・投票結果の可視化
・将来的なsymbol連携DAO

その他
・チャット機能
・スポット分析画面
・ユーザー管理画面
・本番環境向けDB移行

## Git運用ルール

main
安定版のブランチです。
直接作業せず、developからPullRequestで反映する

develop
開発統合用のブランチです。
各機能のブランチ作業が完了したらdevelopへマージします。

## 現在の開発状況まとめ
現時点では以下の流れが動作する状態です。
1. ユーザー登録
2. symbolウォレット自動生成
3. OC Passport初期作成
4. ログイン
5. 管理者がSpotを登録してQRコード発行
6. ユーザーがQRコードを読み取る
7. スタンプ取得
8. StampLog保存
9. スタンプ数・level・称号変更
10. ダッシュボードに反映

