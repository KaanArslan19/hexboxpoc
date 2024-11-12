import * as multisig from "@sqds/multisig"
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"

const { Permission, Permissions } = multisig.types

interface CreateSquadsWalletResponse {
    tx: Transaction,
    multisigPda: PublicKey
}

export async function createSquadsWallet(creatorPubKey: PublicKey): Promise<CreateSquadsWalletResponse> {
    const connection = new Connection(`https://api.devnet.solana.com`) //https://api.mainnet-beta.solana.com

    // Random Public Key that will be used to derive a multisig PDA
    // This will need to be a signer on the transaction
    const createKeySigner = Keypair.generate();
    const createKey = createKeySigner.publicKey;

    // Derive the multisig PDA
    const [multisigPda] = multisig.getMultisigPda({
        createKey,
        programId: multisig.PROGRAM_ID
    });
    
    const [programConfig] = multisig.getProgramConfigPda({
        programId: multisig.PROGRAM_ID
    });

    const programConfigInfo =
        await multisig.accounts.ProgramConfig.fromAccountAddress(
          connection,
          programConfig
        );

    const configTreasury = programConfigInfo.treasury;
    
    const ix = multisig.instructions.multisigCreateV2({
        // Must sign the transaction, unless the .rpc method is used.
        createKey: createKey,
        // The creator & fee payer
        creator: creatorPubKey,
        // The PDA of the multisig you are creating, derived by a random PublicKey
        multisigPda,
        // Here the config authority will be the system program
        configAuthority: null,
        // Create without any time-lock
        timeLock: 0,
        // List of the members to add to the multisig
        members: [{
                // Members Public Key
                key: creatorPubKey,
                // Granted Proposer, Voter, and Executor permissions
                permissions: Permissions.all(),
            },
            // {
            //     key: secondMember.publicKey,
            //     // Member can only add votes to proposed transactions
            //     permissions: Permissions.fromPermissions([Permission.Vote]),
            // },
        ],
        // This means that there needs to be 2 votes for a transaction proposal to be approved
        threshold: 1,
        // This is for the program config treasury account
        treasury: configTreasury,
        // Rent reclaim account
        rentCollector: null,
        programId: multisig.PROGRAM_ID
    });

    const tx = new Transaction().add(ix);
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    tx.feePayer = creatorPubKey;
    tx.partialSign(createKeySigner);

    return {
        tx,
        multisigPda
    }
}

