const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {
    APP_SECRET,
    getUserId
} = require('../utils')

async function post(root, args, context, info) {
    const {
        url,
        description
    } = args;

    const userId = getUserId(context);

    return context.db.mutation.createLink({
        data: {
            url,
            description,
            postedBy: {
                connect: {
                    id: userId
                }
            }
        },
    }, info)
};

async function updateLink(root, args) {
    const {
        id,
        description,
        url
    } = args;

    let item = links.find(item => item.id = id);
    if (item) {
        item = {
            ...item,
            url: url ? url : item.url,
            description: description ? description : item.description,
        };
        links[id] = item;
    }

    return item;
};

async function deleteLink(root, args) {
    const {
        id
    } = args;

    const link = links[id];
    if (link) {
        links.splice(id, 1);
    }

    return link;
};

async function signup(root, args, context, info) {
    const password = await bcrypt.hash(args.password, 10);

    const user = await context.db.mutation.createUser({
        data: { ...args,
            password
        }
    }, `{id}`);

    const token = jwt.sign({
        userId: user.id
    }, APP_SECRET)

    return {
        token,
        user
    }
}

async function login(root, args, context, info) {
    const user = await context.db.query.user({
        where: {
            email: args.email
        }
    }, `{id password}`)

    if (!user)
        throw new Error('No user found')


    const valid = await bcrypt.compare(args.password, user.password);

    if (!valid)
        throw new Error('Invalid password');

    const token = jwt.sign({
        userId: user.id
    }, APP_SECRET)

    return {
        token,
        user
    }
}

async function vote(root, args, context, info) {
    const userId = getUserId(context)

    const linkExists = await context.db.exists.Vote({
        user: {
            id: userId
        },
        link: {
            id: args.linkId
        },
    })
    if (linkExists) {
        throw new Error(`Already voted for link: ${args.linkId}`)
    }

    return context.db.mutation.createVote({
            data: {
                user: {
                    connect: {
                        id: userId
                    }
                },
                link: {
                    connect: {
                        id: args.linkId
                    }
                },
            },
        },
        info,
    )
}


module.exports = {
    post,
    updateLink,
    deleteLink,
    signup,
    login,
    vote
}